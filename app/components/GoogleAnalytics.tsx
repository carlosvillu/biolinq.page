interface GoogleAnalyticsProps {
  measurementId: string | undefined
  nodeEnv: string
  hashedUserId: string | null
}

export function GoogleAnalytics({ measurementId, nodeEnv, hashedUserId }: GoogleAnalyticsProps) {
  if (!measurementId) {
    return null
  }

  return (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${measurementId}', { send_page_view: false${hashedUserId ? `, user_id: '${hashedUserId}'` : ''} });
            gtag('set', 'user_properties', { environment: '${nodeEnv}' });
          `,
        }}
      />
    </>
  )
}
