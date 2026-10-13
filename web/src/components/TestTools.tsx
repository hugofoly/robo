export function TestTools({ failNext, onChange }: { failNext: boolean; onChange: (v: boolean) => void }) {
  return (
    <details className="test-tools">
      <summary>Ferramentas de teste</summary>
      <label className="toggle-row">
        <input type="checkbox" checked={failNext} onChange={(e) => onChange(e.target.checked)} />
        <span>Simular erro na próxima geração</span>
      </label>
    </details>
  )
}
