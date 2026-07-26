import React from 'react'

export default function DefinitionList({
  entries,
}: {
  entries: [string, string][]
}) {
  return (
    <dl>
      {entries.map(([key, val]) => (
        <React.Fragment key={key}>
          <dt>{key}</dt>
          <dd>{val}</dd>
        </React.Fragment>
      ))}
    </dl>
  )
}
