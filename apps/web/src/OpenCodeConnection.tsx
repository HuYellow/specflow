import { useState } from 'react';
import { Save } from 'lucide-react';
import { api } from './api.ts';
import { openCodeConfiguration, type BackendCatalog } from './backendSelection.ts';

export function OpenCodeConnection({ catalog, busy, perform, refreshCatalog }: {
  catalog?: BackendCatalog;
  busy: boolean;
  perform(operation: () => Promise<unknown>, message?: string): Promise<void>;
  refreshCatalog(): Promise<void>;
}) {
  const configured = catalog?.configuration?.opencode;
  const [baseUrl, setBaseUrl] = useState(configured?.baseUrl || 'http://127.0.0.1:4096');
  const [username, setUsername] = useState(configured?.username || '');
  const [password, setPassword] = useState<string>();
  return <div className="connection-form">
    <p className="form-note">先运行 <code>opencode serve</code>，并在 OpenCode 中配置模型供应商，再保存服务连接并刷新模型目录。</p>
    <p className="form-note">请使用可信的 OpenCode 用户配置。当前不加载工作区及父目录中的项目配置和自定义扩展；供应商请配置在用户级设置中。</p>
    <label className="field">OpenCode 服务地址<input value={baseUrl} onChange={event => setBaseUrl(event.target.value)} placeholder="http://127.0.0.1:4096" disabled={busy} /></label>
    <div className="role-grid">
      <label className="field">用户名 · 可选<input value={username} onChange={event => setUsername(event.target.value)} placeholder="启用服务认证时填写" autoComplete="off" disabled={busy} /></label>
      <label className="field">密码 · 可选<input type="password" value={password || ''} onChange={event => setPassword(event.target.value)} placeholder={configured?.hasPassword ? '已保存；留空保留原密码' : '未设置密码'} autoComplete="off" disabled={busy} /></label>
    </div>
    {configured?.hasPassword && <><button className="text-button" disabled={busy} onClick={() => setPassword(password === '' ? undefined : '')}>{password === '' ? '取消清除密码' : '清除已保存密码'}</button>{password === '' && <p className="form-note">保存连接时将清除密码。</p>}</>}
    <button className="outline-button" disabled={busy || !baseUrl.trim()} onClick={() => perform(async () => {
      await api('/backend/opencode/configure', openCodeConfiguration(baseUrl, username, password));
      setPassword(undefined);
      await refreshCatalog();
    }, 'OpenCode 服务连接已保存，模型目录已刷新')}><Save size={15} /> 保存 OpenCode 连接</button>
    <p className="form-note">服务连接保存在本机，供所有工程使用。角色模型和执行底座随当前工程保存。</p>
  </div>;
}
