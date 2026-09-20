import InvoiceView from "../components/invoice/InvoiceView";
import { ErrorState, LoadingState } from "../components/common/StateMessage";

function InvoiceDetailPage({ invoice, loading, error, onBack, onRetry }) {
  if (loading) return <section className="panel"><LoadingState label="Đang tải hóa đơn..." /></section>;
  if (error) return <section className="panel"><ErrorState message={error} onRetry={onRetry} /></section>;
  if (!invoice) return null;
  return <InvoiceView invoice={invoice} onBack={onBack} />;
}

export default InvoiceDetailPage;
