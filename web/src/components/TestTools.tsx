/**
 * Controles de teste (simular erro). Não aparecem para usuários: só em desenvolvimento ou com `?ferramentas`
 * no endereço, usado pelos testes automatizados.
 */
function testToolsEnabled(): boolean {
  return import.meta.env.DEV || new URLSearchParams(window.location.search).has('ferramentas')
}

export function TestTools({ failNext, onChange }: { failNext: boolean; onChange: (v: boolean) => void }) {
  if (!testToolsEnabled()) return null
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
