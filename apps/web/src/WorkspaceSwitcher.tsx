import { t } from './i18n.ts';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, FolderGit2 } from 'lucide-react';
import type { Project } from '../../../packages/domain/index.ts';

export function WorkspaceSwitcher({ projects, value, disabled, onChange }: { projects: Project[]; value: string; disabled: boolean; onChange(id: string): void }) {
  const current = projects.find(project => project.id === value);
  const [open, setOpen] = useState(false), [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState({ left: 0, top: 0, width: 320, maxHeight: 400 });
  const trigger = useRef<HTMLButtonElement>(null), menu = useRef<HTMLDivElement>(null), options = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();
  const close = (restoreFocus = false) => { setOpen(false); if (restoreFocus) trigger.current?.focus(); };
  const show = () => { if (disabled) return; setActiveIndex(Math.max(0, projects.findIndex(project => project.id === value))); setOpen(true); };
  const choose = (id: string) => { close(true); onChange(id); };
  useEffect(() => { if (disabled) close(); }, [disabled]);
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const bounds = trigger.current?.getBoundingClientRect(); if (!bounds) return;
      const width = Math.min(Math.max(bounds.width, 320), window.innerWidth - 24);
      const desiredHeight = Math.min(400, projects.length * 74 + 45);
      const below = window.innerHeight - bounds.bottom - 16, above = bounds.top - 16;
      const useAbove = below < Math.min(desiredHeight, 220) && above > below;
      const maxHeight = Math.min(400, Math.max(120, useAbove ? above : below));
      setPosition({ left: Math.max(12, Math.min(bounds.left, window.innerWidth - width - 12)), top: useAbove ? Math.max(12, bounds.top - Math.min(desiredHeight, maxHeight) - 6) : bounds.bottom + 6, width, maxHeight });
    };
    place(); window.addEventListener('resize', place); window.addEventListener('scroll', place, true);
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, [open, projects.length]);
  useEffect(() => {
    if (!open) return;
    options.current[activeIndex]?.focus(); options.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!trigger.current?.contains(event.target as Node) && !menu.current?.contains(event.target as Node)) close(); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  return <>
    <button ref={trigger} type="button" className={`project-selector workspace-selector ${open ? 'is-open' : ''}`} aria-label={t("工程工作空间")} aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? menuId : undefined} data-current-workspace={value} disabled={disabled} onClick={() => open ? close() : show()} onKeyDown={event => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); show(); }
      if (event.key === 'Escape') close(true);
    }}>
      <FolderGit2 size={19} /><span className="workspace-selected-name">{current?.name || t("选择工程工作空间")}</span><span className="workspace-toggle-icon" data-testid="workspace-toggle-arrow"><ChevronDown size={16} /></span>
    </button>
    <div className="workspace-directory" title={current?.rootPath}>{current?.rootPath || t("打开项目目录创建工作空间")}</div>
    {open && createPortal(<div ref={menu} id={menuId} className="workspace-options" role="listbox" aria-label={t("工程工作空间选项")} style={position} onKeyDown={event => {
      if (event.key === 'ArrowDown') { event.preventDefault(); setActiveIndex(index => (index + 1) % projects.length); }
      else if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex(index => (index - 1 + projects.length) % projects.length); }
      else if (event.key === 'Home') { event.preventDefault(); setActiveIndex(0); }
      else if (event.key === 'End') { event.preventDefault(); setActiveIndex(projects.length - 1); }
      else if (event.key === 'Escape') { event.preventDefault(); close(true); }
      else if (event.key === 'Tab') close(true);
    }}><div className="workspace-options-heading">{t("选择工程工作空间")} <span>{projects.length}</span></div>{projects.map((project, index) => <button ref={element => { options.current[index] = element; }} key={project.id} type="button" role="option" aria-selected={project.id === value} tabIndex={index === activeIndex ? 0 : -1} data-project-id={project.id} className={`workspace-option ${project.id === value ? 'selected' : ''}`} onFocus={() => setActiveIndex(index)} onClick={() => choose(project.id)}><FolderGit2 size={18} /><span><strong>{project.name}</strong><small>{project.rootPath}</small></span>{project.id === value && <Check size={16} />}</button>)}</div>, document.body)}
  </>;
}
