'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  FileText,
  Printer,
  Copy,
  Check,
  Building2,
  Calendar,
  User,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export const FundingAgreementsView: React.FC = () => {
  const [selectedAgreement, setSelectedAgreement] = useState<'silva' | 'dissanayake_loan' | 'dissanayake_investor'>('silva');
  const [copied, setCopied] = useState<boolean>(false);
  const [isClient, setIsClient] = useState<boolean>(false);

  // Form customizer fields
  const [executionDate, setExecutionDate] = useState<string>('01st November 2026');
  const [borrowerNic, setBorrowerNic] = useState<string>('');
  const [silvaNic, setSilvaNic] = useState<string>('');
  const [silvaAddress, setSilvaAddress] = useState<string>('Galle, Sri Lanka');
  const [cmmNic, setCmmNic] = useState<string>('');
  const [cmmAddress, setCmmAddress] = useState<string>('Galle, Sri Lanka');
  const [sdmNic, setSdmNic] = useState<string>('');
  const [sdmAddress, setSdmAddress] = useState<string>('Galle, Sri Lanka');

  useEffect(() => {
    setIsClient(true);
  }, []);

  const getAgreementContent = () => {
    const bNic = borrowerNic.trim() || '_______________________';

    if (selectedAgreement === 'silva') {
      const sNic = silvaNic.trim() || '_______________________';
      const sAddr = silvaAddress.trim() || '__________________________________________________';
      return {
        title: 'FRIENDLY LOAN AGREEMENT (0% INTEREST)',
        parties: `BETWEEN: M. A. N. A. SILVA (NIC: ${sNic}) AND CHATHURA PRINTERS (NIC: ${bNic})`,
        amountText: 'LKR 600,000 (Six Hundred Thousand Rupees)',
        termsText: '0% Interest • LKR 50,000 / month • Initial 6-month term',
        text: `FRIENDLY LOAN AGREEMENT (INTEREST-FREE)

THIS FRIENDLY LOAN AGREEMENT is entered into on this ${executionDate} at Galle, Sri Lanka.

BETWEEN:
M. A. N. A. SILVA, holding National Identity Card (NIC) No: ${sNic}, residing at ${sAddr} (hereinafter referred to as the "Lender", which term shall where the context so requires include his/her heirs, executors, administrators, and assigns) of the ONE PART;

AND:
THE PROPRIETOR / AUTHORIZED SIGNATORY OF CHATHURA PRINTERS, holding NIC No: ${bNic}, carrying on business under the name and style of "CHATHURA PRINTERS" at No. 6A, Sri Hemananda Mawatha, Joolgaha, Galle (hereinafter referred to as the "Borrower", which term shall include his/her heirs, executors, administrators, and permitted assigns) of the OTHER PART.

WHEREAS:
A. The Borrower operates Chathura Printers, a commercial printing and copy center in Galle.
B. The Borrower requested a zero-interest financial accommodation of Sri Lankan Rupees Six Hundred Thousand (LKR 600,000/-) for commercial printing machinery and working capital.
C. The Lender, on a friendly and commercial-interest-free basis, has agreed to advance the said sum of LKR 600,000/- subject to the terms and covenants stipulated hereunder.

NOW IT IS MUTUALLY AGREED AS FOLLOWS:

1. PRINCIPAL SUM & RECEIPT
1.1. The Lender provides and the Borrower acknowledges receipt of the full principal sum of Sri Lankan Rupees Six Hundred Thousand (LKR 600,000/-).
1.2. Method of disbursement: Bank Transfer / Cash / Cheque.

2. ZERO INTEREST COVENANT
2.1. The Parties expressly agree that this is a zero-interest (0.0%) friendly loan. No interest, compounding charges, or hidden administrative fees shall accrue or become payable on the principal.

3. REPAYMENT SCHEDULE & INSTALLMENTS
3.1. The Borrower agrees to repay the Loan Principal through regular monthly installments of Sri Lankan Rupees Fifty Thousand (LKR 50,000/-) each.
3.2. Repayments shall commence on or before the 5th day of each calendar month.
3.3. Over the initial term of six (6) consecutive calendar months, the Borrower shall pay six (6) installments totaling LKR 300,000/-.
3.4. The remaining balance of LKR 300,000/- shall either be settled at the conclusion of Month 6 or extended across a further six (6) consecutive monthly installments of LKR 50,000/- upon mutual written agreement, completing full settlement within twelve (12) months.

4. EARLY REPAYMENT WITHOUT PENALTY
4.1. The Borrower reserves the absolute right to prepay any portion or the entire outstanding balance at any time without penalty or fee.

5. MODE OF PAYMENT
5.1. Repayments shall be remitted to the Lender's designated bank account or in cash against a signed written receipt.

6. GOVERNING LAW & JURISDICTION
6.1. This Agreement is governed by the laws of the Democratic Socialist Republic of Sri Lanka, with jurisdiction vested in the competent courts of Galle.

IN WITNESS WHEREOF, the Parties hereto have set their hands at Galle on the date first above written.

___________________________________             ___________________________________
M. A. N. A. SILVA                               CHATHURA PRINTERS / PROPRIETOR
(Lender)                                        (Borrower)
NIC No: ${sNic}                                NIC No: ${bNic}

WITNESSES:
1. Signature: _________________________         2. Signature: _________________________
   Name: ______________________________            Name: ______________________________
   NIC No: ____________________________            NIC No: ____________________________
   Address: ___________________________            Address: ___________________________`,
      };
    } else if (selectedAgreement === 'dissanayake_loan') {
      const cNic = cmmNic.trim() || '_______________________';
      const cAddr = cmmAddress.trim() || '__________________________________________________';
      return {
        title: 'FRIENDLY LOAN AGREEMENT (0% INTEREST)',
        parties: `BETWEEN: C. M. M. DISSANAYAKE (NIC: ${cNic}) AND CHATHURA PRINTERS (NIC: ${bNic})`,
        amountText: 'LKR 400,000 (Four Hundred Thousand Rupees)',
        termsText: '0% Interest • LKR 20,000 / month • 20 monthly installments',
        text: `FRIENDLY LOAN AGREEMENT (INTEREST-FREE)

THIS FRIENDLY LOAN AGREEMENT is entered into on this ${executionDate} at Galle, Sri Lanka.

BETWEEN:
C. M. M. DISSANAYAKE, holding National Identity Card (NIC) No: ${cNic}, residing at ${cAddr} (hereinafter referred to as the "Lender", which term shall include his/her heirs, executors, administrators, and assigns) of the ONE PART;

AND:
THE PROPRIETOR / AUTHORIZED SIGNATORY OF CHATHURA PRINTERS, holding NIC No: ${bNic}, carrying on business under the name and style of "CHATHURA PRINTERS" at No. 6A, Sri Hemananda Mawatha, Joolgaha, Galle (hereinafter referred to as the "Borrower", which term shall include his/her heirs, executors, administrators, and permitted assigns) of the OTHER PART.

WHEREAS:
A. The Borrower operates commercial printing facilities under the name Chathura Printers at Galle.
B. The Lender has agreed to advance an interest-free friendly loan of Sri Lankan Rupees Four Hundred Thousand (LKR 400,000/-) to the Borrower for equipment and shop operations.
C. The Parties wish to record the repayment schedule of LKR 20,000/- per month.

NOW IT IS MUTUALLY AGREED AS FOLLOWS:

1. PRINCIPAL SUM & ACKNOWLEDGEMENT
1.1. The Lender advances and the Borrower acknowledges receipt of the total sum of Sri Lankan Rupees Four Hundred Thousand (LKR 400,000/-).

2. ZERO INTEREST
2.1. This loan is strictly granted on a zero-interest (0.0%) basis. No interest, administrative fee, or surcharge shall be charged.

3. REPAYMENT SCHEDULE (20 MONTHLY INSTALLMENTS)
3.1. The Borrower covenants to repay the full principal through twenty (20) equal and consecutive monthly installments of Sri Lankan Rupees Twenty Thousand (LKR 20,000/-) each (20 x LKR 20,000 = LKR 400,000).
3.2. The first installment shall be payable on or before the 5th day of the first calendar month following disbursement, and subsequent installments on or before the 5th day of each successive calendar month.

4. EARLY REPAYMENT PRIVILEGE
4.1. The Borrower shall be entitled at any time to accelerate settlement or prepay the entire outstanding balance without any penalty.

5. GOVERNING LAW
5.1. This Agreement is governed by the laws of Sri Lanka, with jurisdiction vested in the courts of Galle.

IN WITNESS WHEREOF, the Parties hereto have set their hands at Galle on the date first above written.

___________________________________             ___________________________________
C. M. M. DISSANAYAKE                            CHATHURA PRINTERS / PROPRIETOR
(Lender)                                        (Borrower)
NIC No: ${cNic}                                NIC No: ${bNic}

WITNESSES:
1. Signature: _________________________         2. Signature: _________________________
   Name: ______________________________            Name: ______________________________
   NIC No: ____________________________            NIC No: ____________________________
   Address: ___________________________            Address: ___________________________`,
      };
    } else {
      const dNic = sdmNic.trim() || '_______________________';
      const dAddr = sdmAddress.trim() || '__________________________________________________';
      return {
        title: 'SILENT INVESTMENT & PROFIT-SHARING AGREEMENT',
        parties: `BETWEEN: S. D. M. DISSANAYAKE (NIC: ${dNic}) AND CHATHURA PRINTERS (NIC: ${bNic})`,
        amountText: 'LKR 1,000,000 (One Million Rupees / 10 Lakhs)',
        termsText: '6-Month Moratorium • 10% Profit Share (Investor) • 17% (Owner) • 73% (Retained Reserve)',
        text: `CAPITAL INVESTMENT AND PROFIT-SHARING AGREEMENT

THIS CAPITAL INVESTMENT AND PROFIT-SHARING AGREEMENT is entered into on this ${executionDate} at Galle, Sri Lanka.

BETWEEN:
S. D. M. DISSANAYAKE, holding National Identity Card (NIC) No: ${dNic}, residing at ${dAddr} (hereinafter referred to as the "Investor", which term shall include her heirs, executors, administrators, and assigns) of the ONE PART;

AND:
THE PROPRIETOR / FOUNDER OF CHATHURA PRINTERS, holding NIC No: ${bNic}, carrying on business under the name and style of "CHATHURA PRINTERS" at No. 6A, Sri Hemananda Mawatha, Joolgaha, Galle (hereinafter referred to as the "Managing Partner / Founder", which term shall include his/her heirs, executors, administrators, and permitted assigns) of the OTHER PART.

RECITALS:
A. The Managing Partner owns and actively operates Chathura Printers, a commercial printing and copy business in Galle.
B. The Managing Partner has personally contributed Sri Lankan Rupees Seven Hundred Thousand (LKR 700,000/-) (comprising 3+4 Lakhs self-capital) into the equity and capital base of the business.
C. The Investor wishes to invest capital in the sum of Sri Lankan Rupees One Million (LKR 1,000,000/-) (Ten Lakhs) as an equity investment in Chathura Printers in exchange for a Ten Percent (10%) share of monthly net profits, subject to an initial six (6) month gestation/moratorium period.
D. The Parties wish to formally record the covenants and distribution ratios governing this investment.

NOW IT IS MUTUALLY AGREED AS FOLLOWS:

1. INVESTMENT CAPITAL & DESIGNATION
1.1. The Investor contributes the principal sum of Sri Lankan Rupees One Million (LKR 1,000,000/-) (the "Investment Capital") into the capital fund of Chathura Printers.
1.2. Silent Investor Status: The Investor acts strictly as a financial investor (silent partner). The Investor shall NOT be responsible for day-to-day management, employee supervision, operational liabilities, supplier contracts, or third-party claims incurred by Chathura Printers.
1.3. The Managing Partner exercises complete operational control over business operations, pricing, machine purchasing, and fulfillment.

2. SIX (6) MONTH GESTATION PERIOD (MORATORIUM)
2.1. The Parties acknowledge that a printing business requires a ramp-up phase to install machinery, secure paper supply chains, and build repeat commercial client volume.
2.2. There shall be a strict moratorium of six (6) consecutive calendar months commencing from the Effective Date (the "Gestation Period").
2.3. During Months 1 to 6, NO profit distributions or dividends shall be declared or drawn by either the Investor or the Managing Partner.
2.4. One hundred percent (100%) of all operating cash flow and surplus generated during the Gestation Period shall be retained within the business bank accounts to fund working capital reserves and ensure uninterrupted operations.

3. PROFIT ALLOCATION RATIOS (COMMENCING MONTH 7)
3.1. Commencing from Month Seven (7) onwards, the audited monthly Net Profit of Chathura Printers shall be distributed according to the following agreed percentage ratios:
   • S. D. M. DISSANAYAKE (Investor):  10.0%  (Silent Investor Dividend, paid monthly)
   • MANAGING FOUNDER:                 17.0%  (Executive Founder Profit Draw)
   • CHATHURA PRINTERS SHOP ACCOUNT:    73.0%  (Retained Earnings for Equipment Reserve, Maintenance, Debt Service & Working Capital)
   • TOTAL:                           100.0%

4. DEFINITION OF "NET PROFIT"
4.1. "Net Profit" for each calendar month shall be calculated as:
   Net Profit = Gross Revenue - (Direct Material Costs + Utilities & Overhead + Staff Basic Wages + Machinery Depreciation Reserve + Monthly Debt Service).
4.2. Calculation shall be derived directly from the Chathura Printers Cashbook and verified POS system records at the end of each calendar month.

5. DISBURSEMENT OF INVESTOR PROFITS
5.1. The Investor's 10% profit dividend shall be calculated within seven (7) days following the end of each calendar month and credited directly to the Investor's designated bank account on or before the 10th day of each calendar month starting at Month 7.

6. FINANCIAL TRANSPARENCY & INSPECTION RIGHTS
6.1. The Managing Partner shall maintain clear computerized financial records via the POS Cashbook system.
6.2. The Investor shall have the reasonable right, upon giving 48 hours' written notice, to inspect the monthly sales reports, expense ledgers, and bank statements of Chathura Printers.

7. EXIT & BUYOUT OPTION
7.1. At any time after eighteen (18) months from the Effective Date, the Managing Partner shall have the first right of option to repurchase the Investor's 10% equity share and repay the full LKR 1,000,000/- capital to re-acquire 100% full unencumbered ownership of the business.

8. GOVERNING LAW
8.1. This Agreement is executed and governed under the laws of the Democratic Socialist Republic of Sri Lanka, with jurisdiction vested in the courts of Galle.

IN WITNESS WHEREOF, the Parties hereto have set their hands at Galle on the date first above written.

___________________________________             ___________________________________
S. D. M. DISSANAYAKE                            CHATHURA PRINTERS / FOUNDER
(Investor)                                      (Managing Partner)
NIC No: ${dNic}                                NIC No: ${bNic}

WITNESSES:
1. Signature: _________________________         2. Signature: _________________________
   Name: ______________________________            Name: ______________________________
   NIC No: ____________________________            NIC No: ____________________________
   Address: ___________________________            Address: ___________________________`,
      };
    }
  };

  const agreement = getAgreementContent();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(agreement.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert('Could not copy automatically. Please select and copy text manually.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Render printable portal copy into #print-root
  const printablePortal = isClient && document.getElementById('print-root') ? (
    createPortal(
      <div className="p-10 font-serif text-[12pt] leading-relaxed text-black max-w-4xl mx-auto bg-white">
        <div className="text-center font-bold text-[14pt] uppercase tracking-wide border-b-2 border-black pb-3 mb-6">
          {agreement.title}
        </div>
        <pre className="font-serif whitespace-pre-wrap text-[11pt] leading-relaxed text-black font-normal">
          {agreement.text}
        </pre>
      </div>,
      document.getElementById('print-root')!
    )
  ) : null;

  return (
    <div className="space-y-6">
      {/* Agreement Selection Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
              Contract Center
            </span>
            <h3 className="text-lg font-black text-slate-900 mt-1">
              Select Agreement to Review, Customize & Sign
            </h3>
            <p className="text-xs text-slate-500">
              Legally drafted contracts under Sri Lankan commercial law with stamp duty placeholders.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Text</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Agreement</span>
            </button>
          </div>
        </div>

        {/* Tabs for 3 agreements */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100">
          <button
            onClick={() => setSelectedAgreement('silva')}
            className={`p-3 rounded-xl border text-left transition ${
              selectedAgreement === 'silva'
                ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-500/20 shadow-sm'
                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900">1. M. A. N. A. Silva</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
                0% Loan
              </span>
            </div>
            <div className="text-sm font-bold font-mono text-emerald-700 mt-1">Rs. 600,000</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Rs. 50,000 / month • Term 6 mo</div>
          </button>

          <button
            onClick={() => setSelectedAgreement('dissanayake_loan')}
            className={`p-3 rounded-xl border text-left transition ${
              selectedAgreement === 'dissanayake_loan'
                ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-500/20 shadow-sm'
                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900">2. C. M. M. Dissanayake</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
                0% Loan
              </span>
            </div>
            <div className="text-sm font-bold font-mono text-emerald-700 mt-1">Rs. 400,000</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Rs. 20,000 / month • 20 months</div>
          </button>

          <button
            onClick={() => setSelectedAgreement('dissanayake_investor')}
            className={`p-3 rounded-xl border text-left transition ${
              selectedAgreement === 'dissanayake_investor'
                ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-500/20 shadow-sm'
                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900">3. S. D. M. Dissanayake</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded">
                Investor
              </span>
            </div>
            <div className="text-sm font-bold font-mono text-purple-700 mt-1">Rs. 1,000,000</div>
            <div className="text-[11px] text-slate-500 mt-0.5">10% Profit Share after Month 6</div>
          </button>
        </div>
      </div>

      {/* Quick Customization Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <span className="text-xs font-bold text-slate-700 block">
          Contract Details (Fills in automatically before printing):
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="text-slate-500 block mb-1">Execution Date</label>
            <input
              type="text"
              value={executionDate}
              onChange={(e) => setExecutionDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium"
            />
          </div>
          <div>
            <label className="text-slate-500 block mb-1">Your (Borrower/Founder) NIC</label>
            <input
              type="text"
              placeholder="e.g. 199012345678 or 901234567V"
              value={borrowerNic}
              onChange={(e) => setBorrowerNic(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-medium"
            />
          </div>
          {selectedAgreement === 'silva' && (
            <div>
              <label className="text-slate-500 block mb-1">M. A. N. A. Silva's NIC</label>
              <input
                type="text"
                placeholder="Lender NIC number"
                value={silvaNic}
                onChange={(e) => setSilvaNic(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-medium"
              />
            </div>
          )}
          {selectedAgreement === 'dissanayake_loan' && (
            <div>
              <label className="text-slate-500 block mb-1">C. M. M. Dissanayake's NIC</label>
              <input
                type="text"
                placeholder="Lender NIC number"
                value={cmmNic}
                onChange={(e) => setCmmNic(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-medium"
              />
            </div>
          )}
          {selectedAgreement === 'dissanayake_investor' && (
            <div>
              <label className="text-slate-500 block mb-1">S. D. M. Dissanayake's NIC</label>
              <input
                type="text"
                placeholder="Investor NIC number"
                value={sdmNic}
                onChange={(e) => setSdmNic(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-medium"
              />
            </div>
          )}
        </div>
      </div>

      {/* Contract Viewer Paper Box */}
      <div className="bg-slate-200/70 p-4 sm:p-8 rounded-3xl border border-slate-300 shadow-inner flex justify-center">
        <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full p-8 md:p-12 border border-slate-200 space-y-6 font-serif">
          {/* Header Seal */}
          <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
            <span className="text-[10px] font-sans font-bold tracking-widest text-slate-500 uppercase">
              Democratic Socialist Republic of Sri Lanka
            </span>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-wide font-sans">
              {agreement.title}
            </h2>
            <div className="text-xs font-sans text-emerald-800 font-bold">
              {agreement.amountText}
            </div>
            <div className="text-[11px] font-sans text-slate-500">
              {agreement.termsText}
            </div>
          </div>

          {/* Legal Text */}
          <pre className="font-serif whitespace-pre-wrap text-xs md:text-sm leading-relaxed text-slate-800 font-normal">
            {agreement.text}
          </pre>

          {/* Legal Stamp Notice */}
          <div className="pt-4 border-t border-slate-200 font-sans text-[11px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Affix LKR 25/- or 50/- Revenue Stamp prior to signing</span>
            </span>
            <span className="italic">Galle, Southern Province</span>
          </div>
        </div>
      </div>

      {printablePortal}
    </div>
  );
};
