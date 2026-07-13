export function Rules() {
  const sections = [
    ['1. General Terms','SwiftSwap is an automatic currency exchange service operating 24/7. We provide conversion between cryptocurrencies and fiat currencies without manual intervention. By placing an order, you confirm you have read and accepted these rules.\n\nSwiftSwap reserves the right to refuse service, suspend exchanges, or cancel orders at any time if violations of these rules are detected or if legally required to do so.'],
    ['2. Exchange Process','All exchange rates displayed are locked at the exact time of order creation. The rate will not change after your order is confirmed, regardless of market movements during processing.\n\nOnce an exchange order is created, you have 60 minutes to complete your payment. Orders that are not paid within the allotted time will be automatically cancelled and you will need to create a new order at the current rate.'],
    ['3. Payment Requirements','You must send the exact amount specified in your order. Sending a different amount may result in automatic cancellation, delays, or a manual review process that can take up to 24 hours.\n\nAll platform fees are already included in the exchange rate displayed to you. There are no hidden fees. Optional priority processing (5 USDT) and VIP support (3 USDT) fees are stated clearly before order creation.\n\nYou are responsible for ensuring the correct network is used when sending cryptocurrency. Sending funds on the wrong network may result in permanent loss of funds.'],
    ['4. Receiving Funds','Converted funds will be sent to the wallet address or bank card you provide at order creation. You are fully responsible for providing the correct receiving address. SwiftSwap cannot reverse a completed transaction sent to an incorrect address.\n\nProcessing time is typically 5 to 60 minutes depending on blockchain confirmation speed, network congestion, and the currencies involved.'],
    ['5. Refund Policy','If an exchange is cancelled before processing, funds received will be returned to the original sender address minus the applicable network fee for the return transaction.\n\nIf an exchange is suspended due to AML verification, you will be contacted via the email address provided in your order. Refunds in such cases may take up to 5 business days.\n\nSwiftSwap does not provide refunds for completed exchanges. Once funds have been sent to your destination address, the transaction is final and irreversible.'],
    ['6. Prohibited Activities','The following activities are strictly prohibited: using SwiftSwap to launder money or exchange funds of illegal origin; attempting to manipulate exchange rates through coordinated actions; creating multiple accounts to circumvent exchange limits; using automated bots or scripts to abuse the platform; providing false personal information during verification; using stolen payment methods or unauthorized bank cards; exchanging funds linked to sanctioned individuals or entities.'],
    ['7. Exchange Limits','Each exchange direction has its own minimum and maximum limits displayed before you create an order. These limits exist to ensure reserve availability and regulatory compliance.\n\nRegistered users may have higher limits than guest users. Verified users may qualify for even higher limits upon completing our KYC process.'],
    ['8. Liability','SwiftSwap is not liable for losses resulting from: incorrect wallet addresses or bank card numbers provided by the user; blockchain network delays or failures; force majeure events; or losses resulting from market price fluctuations after order creation.\n\nOur maximum liability in any case is limited to the amount of the exchange order in question.'],
    ['9. Privacy','SwiftSwap collects minimal user data necessary to process exchanges, including email address, IP address, and wallet addresses. This data is stored securely and used solely for transaction processing, fraud prevention, and regulatory compliance.\n\nWe do not sell user data to third parties. Data may be shared with regulatory authorities when legally required.'],
    ['10. Amendments','SwiftSwap reserves the right to amend these rules at any time. Continued use of the service after amendments constitutes acceptance of the updated rules. Major changes will be communicated via web alerts.'],
  ];

  return (
    <div className="px-4 md:px-8 py-7 max-w-3xl">
      <h1 className="text-xl md:text-[22px] font-extrabold mb-1.5">Platform Rules</h1>
      <p className="text-[12.5px] text-muted mb-7 pb-5 border-b border-border">
        Please read all rules carefully before using SwiftSwap. By using our service, you agree to these terms in full.
      </p>
      <div className="flex flex-col gap-3">
        {sections.map(([title, body]) => (
          <div key={title} className="bg-bg2 border border-border rounded-xl p-5">
            <h2 className="text-[14px] font-bold text-yellow mb-3">{title}</h2>
            {body.split('\n\n').map((p,i) => (
              <p key={i} className="text-[12.5px] text-muted leading-relaxed mb-2.5 last:mb-0">{p}</p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Kyc() {
  const sections = [
    ['What is AML?','Anti-Money Laundering (AML) refers to a set of laws, regulations, and procedures intended to prevent criminals from disguising illegally obtained funds as legitimate income. As a currency exchange service, SwiftSwap is legally required to implement robust AML controls.\n\nOur AML program is designed to detect, deter, and report suspicious financial activity while enabling legitimate users to exchange currencies quickly and conveniently.'],
    ['Automatic AML Verification','Our exchange office carries out automatic AML verification of all transactions using specialized blockchain analytics and risk-scoring services. Every deposit address, incoming transaction, and outgoing transfer is scanned in real time before processing.\n\nThis verification happens automatically in the background and does not cause delays for the vast majority of legitimate transactions. High-risk transactions are flagged and may require additional review.'],
    ['High-Risk Transaction Flags','If a transaction is identified as high-risk, SwiftSwap reserves the right to suspend the exchange operation and request identity verification. High-risk indicators include: darknet connections, crypto mixers / tumblers, gambling platforms, sanctions lists, known scam addresses, high-risk jurisdictions, and structuring patterns.'],
    ['KYC — Identity Verification','SwiftSwap may request identity verification (KYC) in the following circumstances: transactions above certain threshold amounts, when a transaction is flagged by our AML screening, when we have reasonable suspicion of fraudulent or illegal activity, or when required by applicable laws.\n\nDuring KYC verification, you may be asked to provide: a government-issued photo ID, a selfie holding your ID, and proof of address in some cases.'],
    ['Commission Differences','Please note that if you make an exchange for fiat currencies below the specified monitoring limits, commissions may differ from the standard rate shown. This is because smaller fiat transactions may trigger enhanced due diligence requirements that affect processing costs.'],
    ['AML Consent Options','When creating an exchange order, you are asked to select one of the following AML consent options:\n\nOption 1: You consent to a refund (minus network fees) in case the exchange is suspended due to AML reasons. This is the standard option.\n\nOption 2: You declare that you have passed a preliminary AML check and your funds are of legitimate origin. Selecting this option means you take full responsibility for the source of funds.'],
    ['Data Retention','SwiftSwap retains transaction records and KYC documentation for a minimum of 5 years as required by applicable financial regulations. This data is stored securely with encryption and access controls.'],
    ['Reporting Suspicious Activity','SwiftSwap is legally obligated to report suspicious transactions to relevant financial intelligence units and regulatory authorities. We cooperate fully with law enforcement investigations when legally required.\n\nIf you suspect fraudulent activity related to SwiftSwap, please contact our support team immediately at support@swiftswap.com.'],
  ];

  return (
    <div className="px-4 md:px-8 py-7 max-w-3xl">
      <h1 className="text-xl md:text-[22px] font-extrabold mb-1.5">KYC / AML Policy</h1>
      <p className="text-[12.5px] text-muted mb-7 pb-5 border-b border-border">
        SwiftSwap is committed to full Anti-Money Laundering (AML) and Know Your Customer (KYC) compliance to protect our users and the integrity of the financial system.
      </p>
      <div className="flex flex-col gap-3">
        {sections.map(([title, body]) => (
          <div key={title} className="bg-bg2 border border-border rounded-xl p-5">
            <h2 className="text-[14px] font-bold text-yellow mb-3">{title}</h2>
            {body.split('\n\n').map((p,i) => (
              <p key={i} className="text-[12.5px] text-muted leading-relaxed mb-2.5 last:mb-0">{p}</p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
