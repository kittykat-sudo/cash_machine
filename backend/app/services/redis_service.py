import datetime
import logging
from typing import Optional
from decimal import Decimal
import redis
from app.config import settings

logger = logging.getLogger(__name__)

class RedisService:
    def __init__(self):
        self._client: Optional[redis.Redis] = None
        self._connected = False
        self._connect()

    def _connect(self):
        try:
            self._client = redis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2
            )
            self._client.ping()
            self._connected = True
            logger.info("Connected to Redis successfully.")
        except Exception as e:
            self._connected = False
            logger.warning(f"Redis connection failed ({e}). Fallback modes will be used.")

    @property
    def client(self) -> Optional[redis.Redis]:
        if not self._connected or self._client is None:
            self._connect()
        return self._client if self._connected else None

    def generate_bill_number(self, db_fallback_count: Optional[int] = None) -> str:
        """
        Generates an atomic daily bill number in format: BILL-YYYYMMDD-0001
        Uses Redis INCR for concurrency safety. If Redis is unavailable,
        falls back to provided database count + 1.
        """
        today_str = datetime.date.today().strftime("%Y%m%d")
        key = f"bill_counter:{today_str}"
        seq = None

        if self.client:
            try:
                seq = self.client.incr(key)
                # Keep counter key alive for 7 days
                self.client.expire(key, 86400 * 7)
            except Exception as e:
                logger.warning(f"Failed to increment Redis bill counter: {e}")
                seq = None

        if seq is None:
            seq = (db_fallback_count or 0) + 1

        return f"BILL-{today_str}-{int(seq):04d}"

    def get_cached_cash_balance(self) -> Optional[Decimal]:
        if not self.client:
            return None
        try:
            val = self.client.get("cashbook:running_balance")
            return Decimal(val) if val is not None else None
        except Exception:
            return None

    def set_cached_cash_balance(self, balance: Decimal):
        if not self.client:
            return
        try:
            self.client.set("cashbook:running_balance", str(balance), ex=3600)
        except Exception as e:
            logger.warning(f"Failed to cache cash balance: {e}")

    def invalidate_cash_balance(self):
        if not self.client:
            return
        try:
            self.client.delete("cashbook:running_balance")
        except Exception:
            pass

redis_service = RedisService()
