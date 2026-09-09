import CustomerDetail from '../../components/CustomerDetail';

/** Collector view: can correct contribution records, cannot change the account. */
export default function CollectorCustomerDetail() {
  return <CustomerDetail mode="collector" backTo="/collector/customers" />;
}