import Image from "next/image";

export function ProfileAvatar({ photoUrl, firstName, lastName, large = false }: { photoUrl?: string | null; firstName: string; lastName: string; large?: boolean }) {
  const className = `profile-avatar${large ? " large" : ""}`;
  if (photoUrl) return <span className={`${className} has-photo`}><Image src={photoUrl} alt={`${firstName} ${lastName}`} fill sizes={large ? "96px" : "48px"} /></span>;
  return <span className={className}>{firstName[0] ?? "?"}{lastName[0] ?? ""}</span>;
}
