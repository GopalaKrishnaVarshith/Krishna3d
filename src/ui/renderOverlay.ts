import type { ExperienceRole, Project } from "../data/types";
import { escapeHtml } from "./templates";

function tags(items: string[]): string {
  return `<ul class="detail-tags" aria-label="Skills">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function shell(kicker: string, title: string, body: string, index: number, total: number): HTMLElement {
  const dialog = document.createElement("section");
  dialog.className = "detail-overlay";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", "detail-title");
  dialog.innerHTML = `
    <div class="detail-backdrop" data-close aria-hidden="true"></div>
    <div class="detail-panel">
      <div class="detail-topline"><span class="eyebrow">${escapeHtml(kicker)}</span><button class="text-button" type="button" data-close aria-label="Close details">Close <span aria-hidden="true">×</span></button></div>
      <div class="detail-scroll"><p class="detail-counter">${index + 1} / ${total}</p><h2 id="detail-title">${escapeHtml(title)}</h2>${body}</div>
      <nav class="detail-pagination" aria-label="Detail navigation"><button type="button" data-previous aria-label="Previous item">← Previous</button><button type="button" data-next aria-label="Next item">Next →</button></nav>
    </div>`;
  return dialog;
}

export function renderProjectOverlay(project: Project, index: number, total: number): HTMLElement {
  const metrics = project.metrics.length
    ? `<dl class="detail-metrics">${project.metrics.map((metric) => `<div><dt>${escapeHtml(metric.label)}</dt><dd>${escapeHtml(metric.value)}</dd></div>`).join("")}</dl>`
    : "";
  const body = `<p class="detail-lede">${escapeHtml(project.summary)}</p>${metrics}
    <div class="detail-sections"><section><h3>Challenge</h3><p>${escapeHtml(project.challenge)}</p></section><section><h3>Response</h3><p>${escapeHtml(project.response)}</p></section><section><h3>Outcome</h3><p>${escapeHtml(project.outcome)}</p></section></div>${tags(project.skills)}`;
  return shell(`${project.number} · ${project.category}`, project.title, body, index, total);
}

export function renderExperienceOverlay(role: ExperienceRole, index: number, total: number): HTMLElement {
  const body = `<p class="detail-lede">${escapeHtml(role.description)}</p>
    <p class="detail-period">${escapeHtml(role.period)} · ${escapeHtml(role.location)}</p>
    <section class="detail-highlights"><h3>Selected work</h3><ul>${role.highlights.map((highlight) => `<li>${escapeHtml(highlight)}</li>`).join("")}</ul></section>${tags(role.skills)}`;
  return shell(role.company, role.role, body, index, total);
}
