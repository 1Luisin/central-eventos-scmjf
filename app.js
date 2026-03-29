const STORAGE_KEY = "scmjf-central-eventos-v1";

const eventForm = document.querySelector("#eventForm");
const eventsList = document.querySelector("#eventsList");
const registrationList = document.querySelector("#registrationList");
const emptyState = document.querySelector("#emptyState");
const registrationEmptyState = document.querySelector("#registrationEmptyState");
const statsGrid = document.querySelector("#statsGrid");
const loadDemoButton = document.querySelector("#loadDemoButton");
const currentYear = document.querySelector("#currentYear");
const enrollmentModal = document.querySelector("#enrollmentModal");
const enrollmentForm = document.querySelector("#enrollmentForm");
const modalSubtitle = document.querySelector("#modalSubtitle");
const closeModalButton = document.querySelector("#closeModalButton");
const cancelModalButton = document.querySelector("#cancelModalButton");
const toastStack = document.querySelector("#toastStack");

const state = {
  events: loadEvents(),
};

bindEvents();
render();

function bindEvents() {
  currentYear.textContent = String(new Date().getFullYear());

  eventForm.addEventListener("submit", handleEventSubmit);
  eventsList.addEventListener("submit", handleCategorySubmit);
  registrationList.addEventListener("click", handleRegistrationActions);
  loadDemoButton.addEventListener("click", handleLoadDemo);
  enrollmentForm.addEventListener("submit", handleEnrollmentSubmit);
  closeModalButton.addEventListener("click", closeEnrollmentModal);
  cancelModalButton.addEventListener("click", closeEnrollmentModal);
  enrollmentModal.addEventListener("click", handleModalBackdropClick);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !enrollmentModal.hidden) {
      closeEnrollmentModal();
    }
  });
}

function handleEventSubmit(event) {
  event.preventDefault();

  const formData = new FormData(eventForm);
  const start = String(formData.get("start") || "");
  const end = String(formData.get("end") || "");

  if (new Date(end) <= new Date(start)) {
    showToast("A data/hora final precisa ser maior que a inicial.", "error");
    return;
  }

  const newEvent = {
    id: createId("evt"),
    name: String(formData.get("name") || "").trim(),
    start,
    end,
    managerId: String(formData.get("managerId") || "").trim(),
    sector: String(formData.get("sector") || "").trim(),
    createdAt: new Date().toISOString(),
    categories: [],
  };

  state.events = [newEvent, ...state.events].sort(sortEventsByStart);
  persist();
  render();
  eventForm.reset();
  showToast("Evento criado com sucesso.");
  document.querySelector("#eventos").scrollIntoView({ behavior: "smooth", block: "start" });
}

function handleCategorySubmit(event) {
  const form = event.target;

  if (!form.matches(".category-form")) {
    return;
  }

  event.preventDefault();

  const eventId = form.dataset.eventId;
  const eventItem = state.events.find((item) => item.id === eventId);

  if (!eventItem) {
    showToast("Nao foi possivel localizar o evento para cadastrar a categoria.", "error");
    return;
  }

  const formData = new FormData(form);
  const capacity = Number(formData.get("capacity"));

  if (!Number.isInteger(capacity) || capacity <= 0) {
    showToast("Informe um numero de vagas valido para a categoria.", "error");
    return;
  }

  const category = {
    id: createId("cat"),
    name: String(formData.get("name") || "").trim(),
    capacity,
    allowExternal: String(formData.get("allowExternal") || "") === "sim",
    description: String(formData.get("description") || "").trim(),
    createdAt: new Date().toISOString(),
    subscriptions: [],
  };

  eventItem.categories = [...eventItem.categories, category];
  persist();
  render();
  form.reset();
  showToast("Categoria adicionada ao evento.");
}

function handleRegistrationActions(event) {
  const actionButton = event.target.closest("[data-open-enrollment]");

  if (!actionButton) {
    return;
  }

  const eventId = actionButton.dataset.eventId;
  const categoryId = actionButton.dataset.categoryId;
  openEnrollmentModal(eventId, categoryId);
}

function handleEnrollmentSubmit(event) {
  event.preventDefault();

  const formData = new FormData(enrollmentForm);
  const eventId = String(formData.get("eventId") || "");
  const categoryId = String(formData.get("categoryId") || "");
  const found = findCategory(eventId, categoryId);

  if (!found) {
    showToast("Nao foi possivel encontrar a categoria selecionada.", "error");
    return;
  }

  if (isCategoryFull(found.category)) {
    showToast("As vagas desta categoria ja foram preenchidas.", "warning");
    closeEnrollmentModal();
    render();
    return;
  }

  const matricula = String(formData.get("matricula") || "").trim();

  const alreadyRegistered = found.category.subscriptions.some(
    (subscription) => subscription.matricula.toLowerCase() === matricula.toLowerCase(),
  );

  if (alreadyRegistered) {
    showToast("Esta matricula ja esta inscrita nesta categoria.", "warning");
    return;
  }

  found.category.subscriptions = [
    ...found.category.subscriptions,
    {
      id: createId("sub"),
      matricula,
      sector: String(formData.get("sector") || "").trim(),
      contact: String(formData.get("contact") || "").trim(),
      createdAt: new Date().toISOString(),
    },
  ];

  persist();
  render();
  closeEnrollmentModal();
  showToast("Inscricao realizada com sucesso.");
}

function handleLoadDemo() {
  const alreadyLoaded = state.events.some((eventItem) => eventItem.id === "demo-event");

  if (alreadyLoaded) {
    showToast("A demonstracao ja foi inserida neste navegador.", "warning");
    return;
  }

  const demoEvent = {
    id: "demo-event",
    name: "Jornada de Humanizacao Assistencial",
    start: buildFutureDate(3, 8, 30),
    end: buildFutureDate(3, 17, 30),
    managerId: "SCM-10248",
    sector: "Educacao Continuada",
    createdAt: new Date().toISOString(),
    categories: [
      {
        id: "demo-cat-1",
        name: "Palestra Magna",
        capacity: 80,
        allowExternal: true,
        description:
          "Abertura institucional com foco em acolhimento, seguranca do paciente e experiencias humanizadas.",
        createdAt: new Date().toISOString(),
        subscriptions: [
          {
            id: "demo-sub-1",
            matricula: "12458",
            sector: "Enfermagem",
            contact: "ramal 2314",
            createdAt: new Date().toISOString(),
          },
          {
            id: "demo-sub-2",
            matricula: "20874",
            sector: "UTI Adulto",
            contact: "ramal 1182",
            createdAt: new Date().toISOString(),
          },
        ],
      },
      {
        id: "demo-cat-2",
        name: "Oficina de Comunicacao com Familiares",
        capacity: 24,
        allowExternal: false,
        description:
          "Encontro pratico para equipes assistenciais aperfeicoarem comunicacao sensivel em situacoes criticas.",
        createdAt: new Date().toISOString(),
        subscriptions: [
          {
            id: "demo-sub-3",
            matricula: "30987",
            sector: "Servico Social",
            contact: "social@santacasa.local",
            createdAt: new Date().toISOString(),
          },
        ],
      },
    ],
  };

  state.events = [demoEvent, ...state.events].sort(sortEventsByStart);
  persist();
  render();
  showToast("Demonstracao inserida para facilitar a validacao do layout.");
}

function openEnrollmentModal(eventId, categoryId) {
  const found = findCategory(eventId, categoryId);

  if (!found) {
    showToast("Nao foi possivel abrir a categoria escolhida.", "error");
    return;
  }

  enrollmentForm.reset();
  enrollmentForm.elements.eventId.value = eventId;
  enrollmentForm.elements.categoryId.value = categoryId;

  const remainingSeats = Math.max(found.category.capacity - found.category.subscriptions.length, 0);
  modalSubtitle.textContent =
    `${found.event.name} | ${found.category.name} | ${remainingSeats} vaga(s) restante(s)`;

  enrollmentModal.hidden = false;
  document.body.classList.add("modal-open");
  enrollmentForm.elements.matricula.focus();
}

function closeEnrollmentModal() {
  enrollmentModal.hidden = true;
  document.body.classList.remove("modal-open");
}

function handleModalBackdropClick(event) {
  if (event.target instanceof HTMLElement && event.target.dataset.closeModal === "true") {
    closeEnrollmentModal();
  }
}

function render() {
  renderStats();
  renderEvents();
  renderRegistrationCards();
}

function renderStats() {
  const totalEvents = state.events.length;
  const totalCategories = state.events.reduce((total, eventItem) => total + eventItem.categories.length, 0);
  const totalSubscriptions = state.events.reduce(
    (total, eventItem) =>
      total + eventItem.categories.reduce((count, category) => count + category.subscriptions.length, 0),
    0,
  );
  const remainingSeats = state.events.reduce(
    (total, eventItem) =>
      total +
      eventItem.categories.reduce(
        (count, category) => count + Math.max(category.capacity - category.subscriptions.length, 0),
        0,
      ),
    0,
  );

  const cards = [
    { value: totalEvents, label: "Eventos ativos" },
    { value: totalCategories, label: "Categorias abertas" },
    { value: totalSubscriptions, label: "Inscricoes registradas" },
    { value: remainingSeats, label: "Vagas disponiveis" },
  ];

  statsGrid.innerHTML = cards
    .map(
      (card) => `
        <article class="stat-card">
          <strong>${card.value}</strong>
          <span>${card.label}</span>
        </article>
      `,
    )
    .join("");
}

function renderEvents() {
  if (state.events.length === 0) {
    eventsList.innerHTML = "";
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;
  eventsList.innerHTML = state.events
    .map((eventItem) => {
      const categoriesMarkup =
        eventItem.categories.length > 0
          ? eventItem.categories.map((category) => renderAdminCategoryCard(category)).join("")
          : `<div class="empty-card">Nenhuma categoria cadastrada ainda para este evento.</div>`;

      return `
        <article class="event-card">
          <div class="event-card__header">
            <div>
              <span class="card-badge">Evento institucional</span>
              <h3>${escapeHtml(eventItem.name)}</h3>
              <p class="event-card__meta">
                ${escapeHtml(formatDateTime(eventItem.start))} ate ${escapeHtml(formatDateTime(eventItem.end))}
              </p>
            </div>

            <div class="metric-pill">
              ${eventItem.categories.length} categoria(s)
            </div>
          </div>

          <div class="event-card__detail-list">
            <div class="detail-chip">Matricula responsavel: <strong>${escapeHtml(eventItem.managerId)}</strong></div>
            <div class="detail-chip">Setor responsavel: <strong>${escapeHtml(eventItem.sector)}</strong></div>
          </div>

          <div class="event-card__body">
            <div class="category-stack">
              ${categoriesMarkup}
            </div>

            <form class="category-form" data-event-id="${eventItem.id}">
              <h4>Adicionar categoria</h4>
              <p>As categorias cadastradas aqui ficarao visiveis dentro deste mesmo card de evento.</p>

              <div class="category-form__grid">
                <label class="field field--full">
                  <span>NOME DA CATEGORIA</span>
                  <input type="text" name="name" placeholder="Ex.: Minicurso de Atualizacao Clinica" required>
                </label>

                <label class="field">
                  <span>QUANTOS PODEM SE INSCREVER (VAGAS)</span>
                  <input type="number" name="capacity" min="1" step="1" placeholder="Ex.: 30" required>
                </label>

                <label class="field">
                  <span>SE E PERMITIDO INSCRICOES EXTERNAS (S/N)</span>
                  <select name="allowExternal" required>
                    <option value="nao">N</option>
                    <option value="sim">S</option>
                  </select>
                </label>

                <label class="field field--full">
                  <span>DESCRICAO DA CATEGORIA</span>
                  <textarea
                    name="description"
                    placeholder="Descreva objetivo, publico e formato da categoria"
                    required
                  ></textarea>
                </label>
              </div>

              <div class="form-actions">
                <button class="button button--primary" type="submit">Salvar categoria</button>
              </div>
            </form>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderAdminCategoryCard(category) {
  const occupancy = getOccupancy(category);
  const remaining = Math.max(category.capacity - category.subscriptions.length, 0);
  const subscriptionList =
    category.subscriptions.length > 0
      ? category.subscriptions
          .map(
            (subscription) => `
              <div class="subscription-item">
                <div>
                  <strong>Matricula ${escapeHtml(subscription.matricula)}</strong>
                  <span>${escapeHtml(subscription.sector)}</span>
                </div>
                <small>${escapeHtml(subscription.contact)}</small>
              </div>
            `,
          )
          .join("")
      : `<div class="empty-card">Ainda nao ha inscritos nesta categoria.</div>`;

  return `
    <article class="category-card">
      <div class="category-card__head">
        <div>
          <h4>${escapeHtml(category.name)}</h4>
          <div class="tag-group">
            <span class="tag">${category.subscriptions.length}/${category.capacity} inscricoes</span>
            <span class="tag ${category.allowExternal ? "" : "tag--accent"}">
              ${category.allowExternal ? "Inscricao externa permitida" : "Somente publico interno"}
            </span>
            ${remaining === 0 ? '<span class="tag tag--full">Vagas esgotadas</span>' : ""}
          </div>
        </div>

        <span class="status-pill ${remaining > 0 ? "status-pill--success" : ""}">
          ${remaining} vaga(s) restante(s)
        </span>
      </div>

      <p class="category-card__description">${escapeHtml(category.description)}</p>

      <div class="progress" aria-hidden="true">
        <div class="progress__bar" style="width: ${occupancy}%"></div>
      </div>

      <div class="subscription-list">
        ${subscriptionList}
      </div>
    </article>
  `;
}

function renderRegistrationCards() {
  const eventsWithCategories = state.events.filter((eventItem) => eventItem.categories.length > 0);

  if (eventsWithCategories.length === 0) {
    registrationList.innerHTML = "";
    registrationEmptyState.hidden = false;
    return;
  }

  registrationEmptyState.hidden = true;
  registrationList.innerHTML = eventsWithCategories
    .map((eventItem) => {
      const categoriesMarkup = eventItem.categories.map((category) => renderPublicCategoryCard(eventItem, category)).join("");

      return `
        <article class="registration-card">
          <div class="registration-card__header">
            <div>
              <span class="card-badge">Inscricoes abertas</span>
              <h3>${escapeHtml(eventItem.name)}</h3>
              <p class="registration-card__meta">
                ${escapeHtml(formatDateTime(eventItem.start))} ate ${escapeHtml(formatDateTime(eventItem.end))}
              </p>
            </div>

            <span class="metric-pill">${eventItem.categories.length} opcao(oes)</span>
          </div>

          <div class="registration-card__detail-list">
            <div class="detail-chip">Setor responsavel: <strong>${escapeHtml(eventItem.sector)}</strong></div>
            <div class="detail-chip">Responsavel: <strong>${escapeHtml(eventItem.managerId)}</strong></div>
          </div>

          <div class="registration-card__body">
            <div class="category-stack">
              ${categoriesMarkup}
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderPublicCategoryCard(eventItem, category) {
  const remaining = Math.max(category.capacity - category.subscriptions.length, 0);
  const full = remaining === 0;

  return `
    <article class="category-card category-card--public">
      <div class="category-card__head">
        <div>
          <h4>${escapeHtml(category.name)}</h4>
          <div class="tag-group">
            <span class="tag">${category.subscriptions.length}/${category.capacity} ocupadas</span>
            <span class="tag ${category.allowExternal ? "" : "tag--accent"}">
              ${category.allowExternal ? "Aceita inscricoes externas" : "Inscricao interna"}
            </span>
          </div>
        </div>

        <span class="status-pill ${full ? "" : "status-pill--success"}">
          ${full ? "Lotado" : `${remaining} vaga(s)`}
        </span>
      </div>

      <p class="category-card__description">${escapeHtml(category.description)}</p>

      <div class="progress" aria-hidden="true">
        <div class="progress__bar" style="width: ${getOccupancy(category)}%"></div>
      </div>

      <div class="public-category-actions">
        <div class="tag-group">
          <span class="tag">Evento: ${escapeHtml(eventItem.name)}</span>
          <span class="tag">Inicio ${escapeHtml(formatShortDate(eventItem.start))}</span>
        </div>

        <button
          class="button ${full ? "button--ghost" : "button--primary"}"
          type="button"
          data-open-enrollment="true"
          data-event-id="${eventItem.id}"
          data-category-id="${category.id}"
          ${full ? "disabled" : ""}
        >
          ${full ? "Sem vagas" : "Inscrever-se"}
        </button>
      </div>
    </article>
  `;
}

function findCategory(eventId, categoryId) {
  const eventItem = state.events.find((item) => item.id === eventId);

  if (!eventItem) {
    return null;
  }

  const category = eventItem.categories.find((item) => item.id === categoryId);

  if (!category) {
    return null;
  }

  return { event: eventItem, category };
}

function isCategoryFull(category) {
  return category.subscriptions.length >= category.capacity;
}

function getOccupancy(category) {
  if (category.capacity <= 0) {
    return 0;
  }

  return Math.min((category.subscriptions.length / category.capacity) * 100, 100);
}

function formatDateTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatShortDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function createId(prefix) {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.events));
  } catch (error) {
    console.error(error);
    showToast("Nao foi possivel salvar os dados no navegador.", "error");
  }
}

function loadEvents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeEvent) : [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

function buildFutureDate(daysAhead, hours, minutes) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  date.setHours(hours, minutes, 0, 0);

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
}

function sortEventsByStart(first, second) {
  return new Date(first.start).getTime() - new Date(second.start).getTime();
}

function normalizeEvent(eventItem) {
  const categories = Array.isArray(eventItem?.categories) ? eventItem.categories.map(normalizeCategory) : [];

  return {
    id: String(eventItem?.id || createId("evt")),
    name: String(eventItem?.name || "Evento sem nome"),
    start: String(eventItem?.start || ""),
    end: String(eventItem?.end || ""),
    managerId: String(eventItem?.managerId || ""),
    sector: String(eventItem?.sector || ""),
    createdAt: String(eventItem?.createdAt || new Date().toISOString()),
    categories,
  };
}

function normalizeCategory(category) {
  const subscriptions = Array.isArray(category?.subscriptions)
    ? category.subscriptions.map((subscription) => ({
        id: String(subscription?.id || createId("sub")),
        matricula: String(subscription?.matricula || ""),
        sector: String(subscription?.sector || ""),
        contact: String(subscription?.contact || ""),
        createdAt: String(subscription?.createdAt || new Date().toISOString()),
      }))
    : [];

  return {
    id: String(category?.id || createId("cat")),
    name: String(category?.name || "Categoria sem nome"),
    capacity: Math.max(Number(category?.capacity) || 0, 0),
    allowExternal: Boolean(category?.allowExternal),
    description: String(category?.description || ""),
    createdAt: String(category?.createdAt || new Date().toISOString()),
    subscriptions,
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function showToast(message, tone = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${tone === "success" ? "" : `toast--${tone}`}`.trim();
  toast.textContent = message;
  toastStack.append(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 4200);
}
