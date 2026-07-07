import { ProfilePlaceholder } from './icons';

export default function Avatar({
  photoUrl,
  online = true,
  className,
}: {
  photoUrl?: string;
  online?: boolean;
  className?: string;
}) {
  return (
    <div className={`plib-root ${className ?? ''}`}>
      <ProfilePlaceholder photoUrl={photoUrl} online={online} />
    </div>
  );
}
