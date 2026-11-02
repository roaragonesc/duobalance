type PlaceholderPageProps = {
  title: string
}

export default function PlaceholderPage({ title }: PlaceholderPageProps) {
  return <h1 className="text-3xl font-bold text-navy sm:text-4xl">{title}</h1>
}
