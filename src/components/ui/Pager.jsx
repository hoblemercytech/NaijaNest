import Button from './Button';

/**
 * Shared pager. Shows the record count as well as the page number so an admin
 * scanning a filtered ledger knows how much they are actually looking at.
 */
export default function Pager({ page, count, pageSize, onChange }) {
  const pages = Math.ceil(count / pageSize);
  if (pages <= 1) return null;

  return (
    <div className="pager">
      <Button variant="outline" size="sm" disabled={page === 0} onClick={() => onChange(page - 1)}>
        Previous
      </Button>
      <span className="small muted num">
        Page {page + 1} of {pages} · {count} record{count === 1 ? '' : 's'}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page + 1 >= pages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}