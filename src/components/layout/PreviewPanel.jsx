import QuoteSummary from '../preview/QuoteSummary';
import EmailGenerator from '../preview/EmailGenerator';

export default function PreviewPanel() {
    return (
        <div className="w-[320px] min-w-[320px] border-l border-dark-border bg-dark-bg overflow-y-auto h-[calc(100vh-60px)] sticky top-[60px]">
            <div className="p-4">
                <QuoteSummary />
                <EmailGenerator />
            </div>
        </div>
    );
}
