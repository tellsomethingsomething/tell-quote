import { pdf } from '@react-pdf/renderer';
import QuotePDF from '../pdf/QuotePDF';
import { useQuoteStore } from '../../store/quoteStore';
import { useSettingsStore } from '../../store/settingsStore';
import { formatCurrency, convertFromUSD } from '../../utils/currency';
import { CURRENCIES } from '../../data/currencies';
import { calculateGrandTotal, calculateGrandTotalWithFees } from '../../utils/calculations';

export default function LivePreview() {
    const { quote, rates } = useQuoteStore();
    const { settings } = useSettingsStore();
    const client = quote.client || {};
    const fees = quote.fees || {};
    const currencySymbol = CURRENCIES[quote.currency]?.symbol || '$';

    // Calculate totals
    const {
        managementAmount,
        commissionAmount,
        discountAmount,
        totalCharge,
        getDistributedRate
    } = calculateGrandTotalWithFees(quote.sections, quote.fees);

    const isDistributed = quote.fees?.distributeFees;

    // Generate PDF Link
    const generatePDF = async () => {
        const blob = await pdf(
            <QuotePDF quote={quote} currency={quote.currency} />
        ).toBlob();

        const filename = `${client.company || 'Client'} - ${quote.project.title || 'Project'} - ${quote.quoteDate} - Quote.pdf`;

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-white text-black p-4 text-[10px] font-sans shadow-lg min-h-[800px] relative group">
            {/* Header */}
            <div className="flex justify-between items-start mb-8 border-b border-gray-200 pb-4">
                <div className="w-1/2">
                    {/* Company Logo */}
                    {settings.company?.logo ? (
                        <img
                            src={settings.company.logo}
                            alt="Company logo"
                            className="w-32 h-12 object-contain mb-2"
                        />
                    ) : (
                        <div className="w-32 h-12 bg-gray-200 flex items-center justify-center text-gray-400 font-bold mb-2">
                            LOGO
                        </div>
                    )}
                    <div className="text-gray-600">
                        <p className="font-bold text-slate-800">{settings.company?.name}</p>
                        <p>{settings.company?.address}</p>
                        <p>{settings.company?.email}</p>
                        <p>{settings.company?.phone}</p>
                    </div>
                </div>
                <div className="w-1/2 text-right">
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">QUOTATION</h1>
                    <p className="font-bold text-slate-700">Ref: {quote.quoteNumber}</p>
                    <p className="text-slate-500">Date: {quote.quoteDate}</p>
                    <p className="text-slate-500">Valid Until: {
                        (() => {
                            if (!quote.quoteDate) return '-';
                            const date = new Date(quote.quoteDate);
                            date.setDate(date.getDate() + (parseInt(quote.validityDays) || 30));
                            return date.toLocaleDateString();
                        })()
                    }</p>
                </div>
            </div>

            {/* Client Info */}
            <div className="flex mb-8 gap-8">
                <div className="w-1/2">
                    <h3 className="font-bold text-slate-800 border-b border-gray-300 mb-2 pb-1">BILL TO:</h3>
                    <p className="font-bold text-slate-700 text-lg">{client.company}</p>
                    {client.contact && <p className="text-slate-600">Attn: {client.contact}</p>}
                    {client.email && <p className="text-slate-600">{client.email}</p>}
                    {client.address && <p className="text-slate-600">{client.address}</p>}
                </div>
                <div className="w-1/2">
                    <h3 className="font-bold text-slate-800 border-b border-gray-300 mb-2 pb-1">PROJECT:</h3>
                    <p className="font-bold text-slate-700">{quote.project.title}</p>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-slate-600">
                        <div>
                            <span className="font-semibold">Type:</span> {quote.project.type}
                        </div>
                        <div>
                            <span className="font-semibold">Venue:</span> {quote.project.venue}
                        </div>
                        <div>
                            <span className="font-semibold">Dates:</span> {quote.project.startDate} - {quote.project.endDate}
                        </div>
                    </div>
                </div>
            </div>

            {/* Line Items */}
            <div className="mt-8">
                <div className="flex bg-slate-100 p-2 font-bold border-b-2 border-slate-300">
                    <div className="flex-1">Description</div>
                    <div className="w-16 text-center">Qty</div>
                    <div className="w-16 text-center">Days</div>
                    <div className="w-24 text-right">Rate ({currencySymbol})</div>
                    <div className="w-24 text-right">Total ({currencySymbol})</div>
                </div>

                <div className="divide-y divide-gray-100">
                    {/* Iterate Sections */}
                    {Object.values(quote.sections).map(section => (
                        (section.isExpanded && Object.values(section.subsections).some(arr => arr.length > 0)) && (
                            <div key={section.id} className="py-2">
                                <div className="font-bold text-slate-700 bg-slate-50 px-2 py-1 mb-1">{section.name}</div>
                                {Object.entries(section.subsections).map(([, items]) => (
                                    items.map(item => (
                                        <div key={item.id} className="flex px-2 py-1 text-slate-600">
                                            <div className="flex-1">{item.name}</div>
                                            <div className="w-16 text-center">{item.quantity}</div>
                                            <div className="w-16 text-center">{item.days}</div>
                                            <div className="w-24 text-right">
                                                {formatCurrency(
                                                    convertFromUSD(getDistributedRate(item.charge), quote.currency, rates),
                                                    quote.currency,
                                                    { showSymbol: false }
                                                )}
                                            </div>
                                            <div className="w-24 text-right">
                                                {formatCurrency(
                                                    convertFromUSD(getDistributedRate(item.charge) * (item.quantity || 1) * (item.days || 1), quote.currency, rates),
                                                    quote.currency,
                                                    { showSymbol: false }
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ))}
                            </div>
                        )
                    ))}
                </div>
            </div>

            {/* Totals */}
            <div className="mt-8 flex justify-end">
                <div className="w-64 space-y-2">
                    <div className="flex justify-between text-slate-600">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(convertFromUSD(calculateGrandTotal(quote.sections).totalCharge, quote.currency, rates), quote.currency)}</span>
                    </div>

                    {/* Fees - Only show if not distributed */}
                    {!isDistributed && (
                        <>
                            {fees.managementFee > 0 && (
                                <div className="flex justify-between text-slate-600 text-[9px]">
                                    <span>Management Fee ({fees.managementFee}%):</span>
                                    <span>{formatCurrency(convertFromUSD(managementAmount, quote.currency, rates), quote.currency)}</span>
                                </div>
                            )}
                            {fees.commissionFee > 0 && (
                                <div className="flex justify-between text-slate-600 text-[9px]">
                                    <span>Commission ({fees.commissionFee}%):</span>
                                    <span>{formatCurrency(convertFromUSD(commissionAmount, quote.currency, rates), quote.currency)}</span>
                                </div>
                            )}
                        </>
                    )}

                    {fees.discount > 0 && (
                        <div className="flex justify-between text-red-500">
                            <span>Discount ({fees.discount}%):</span>
                            <span>-{formatCurrency(convertFromUSD(discountAmount, quote.currency, rates), quote.currency)}</span>
                        </div>
                    )}

                    <div className="flex justify-between font-bold text-lg text-slate-800 border-t-2 border-slate-800 pt-2">
                        <span>Total:</span>
                        <span>{formatCurrency(convertFromUSD(totalCharge, quote.currency, rates), quote.currency)}</span>
                    </div>
                </div>
            </div>

            {/* Overlay for PDF gen */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                <button
                    onClick={generatePDF}
                    className="bg-accent-primary hover:bg-accent-secondary text-white px-6 py-3 rounded-full font-bold shadow-xl transform transition hover:scale-105 flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download PDF
                </button>
            </div>
        </div>
    );
}
