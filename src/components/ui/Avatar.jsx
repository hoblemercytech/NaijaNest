import { initials } from '../../lib/format';

export default function Avatar({ name, url, size = 40 }) {
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {url ? <img src={url} alt="" /> : initials(name)}
    </span>
  );
}