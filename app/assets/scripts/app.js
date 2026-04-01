const STORAGE_KEY = "scmjf-central-eventos-v1";
const PAGE_TRANSITION_DURATION = 300;
const APP_PAGES_ROOT = new URL("../", window.location.href);
const PAGE_ROUTES = {
  dashboard: new URL("dashboard/", APP_PAGES_ROOT).href,
  cadastros: new URL("cadastros/", APP_PAGES_ROOT).href,
  inscricoes: new URL("inscricoes/", APP_PAGES_ROOT).href,
};

const statsGrid = document.querySelector("#statsGrid");
const eventsList = document.querySelector("#eventsList");
const emptyState = document.querySelector("#emptyState");
const loadDemoButton = document.querySelector("#loadDemoButton");
const currentYear = document.querySelector("#currentYear");

const eventForm = document.querySelector("#eventForm");
const categoryRegistrationForm = document.querySelector("#categoryRegistrationForm");
const categoryEventSelect = document.querySelector("#categoryEventSelect");
const categoryFieldset = document.querySelector("#categoryFieldset");
const categoryFormEmptyState = document.querySelector("#categoryFormEmptyState");
const eventSummaryList = document.querySelector("#eventSummaryList");
const categorySubmitButton = categoryRegistrationForm
  ? categoryRegistrationForm.querySelector('button[type="submit"]')
  : null;

const registrationList = document.querySelector("#registrationList");
const registrationEmptyState = document.querySelector("#registrationEmptyState");
const enrollmentForm = document.querySelector("#enrollmentForm");
const enrollmentFieldset = document.querySelector("#enrollmentFieldset");
const enrollmentSelectionTitle = document.querySelector("#enrollmentSelectionTitle");
const enrollmentSelectionMeta = document.querySelector("#enrollmentSelectionMeta");
const enrollmentSelectionTags = document.querySelector("#enrollmentSelectionTags");
const enrollmentStatusNote = document.querySelector("#enrollmentStatusNote");

const toastStack = document.querySelector("#toastStack");

const state = {
  events: loadEvents().sort(sortEventsByStart),
  selectedEnrollment: null,
};

state.selectedEnrollment = getRequestedEnrollmentSelection();

bindEvents();
render();

function buildPageHref(pageName, options = {}) {
  const { searchParams = {}, hash = "" } = options;
  const url = new URL(PAGE_ROUTES[pageName]);

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  if (hash) {
    url.hash = hash;
  }

  return url.href;
}

function bindEvents() {
  initializePageTransitions();

  if (currentYear) {
    currentYear.textContent = String(new Date().getFullYear());
  }

  if (eventForm) {
    eventForm.addEventListener("submit", handleEventSubmit);
  }

  if (categoryRegistrationForm) {
    categoryRegistrationForm.addEventListener("submit", handleCategoryRegistrationSubmit);
  }

  if (categoryEventSelect) {
    categoryEventSelect.addEventListener("change", handleCategoryEventChange);
  }

  if (registrationList) {
    registrationList.addEventListener("click", handleRegistrationActions);
  }

  if (enrollmentForm) {
    enrollmentForm.addEventListener("submit", handleEnrollmentSubmit);
  }

  if (loadDemoButton) {
    loadDemoButton.addEventListener("click", handleLoadDemo);
  }
}

function initializePageTransitions() {
  const systemShell = document.querySelector(".system-shell");

  if (!systemShell || !document.body) {
    return;
  }

  const overlay = document.createElement("div");
  overlay.className = "page-transition-overlay";
  overlay.setAttribute("aria-hidden", "true");
  document.body.append(overlay);

  window.addEventListener("pageshow", () => {
    document.body.classList.remove("page-transitioning");
  });

  document.addEventListener("click", handlePageTransitionNavigation);
}

function handlePageTransitionNavigation(event) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }

  const link = event.target.closest("a[href]");

  if (!link || link.target === "_blank" || link.hasAttribute("download")) {
    return;
  }

  const rawHref = link.getAttribute("href");

  if (
    !rawHref ||
    rawHref.startsWith("#") ||
    rawHref.startsWith("mailto:") ||
    rawHref.startsWith("tel:") ||
    rawHref.startsWith("javascript:")
  ) {
    return;
  }

  const destination = new URL(link.href, window.location.href);
  const current = new URL(window.location.href);
  const sameDocumentAnchor =
    destination.origin === current.origin &&
    destination.pathname === current.pathname &&
    destination.search === current.search &&
    destination.hash !== current.hash;
  const sameUrl =
    destination.origin === current.origin &&
    destination.pathname === current.pathname &&
    destination.search === current.search &&
    destination.hash === current.hash;

  if (sameDocumentAnchor || sameUrl || destination.origin !== current.origin) {
    return;
  }

  event.preventDefault();
  navigateWithTransition(destination.href);
}

function navigateWithTransition(url) {
  if (!document.body || document.body.classList.contains("page-transitioning")) {
    return;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.location.href = url;
    return;
  }

  document.body.classList.add("page-transitioning");

  window.setTimeout(() => {
    window.location.href = url;
  }, PAGE_TRANSITION_DURATION);
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
  eventForm.reset();

  if (categoryEventSelect) {
    syncCategorySelection(newEvent.id);
  }

  render();
  showToast("Evento criado com sucesso.");

  if (categoryRegistrationForm) {
    window.location.hash = "categorias";
    focusCategoryNameField();
  }
}

function handleCategoryRegistrationSubmit(event) {
  event.preventDefault();

  const formData = new FormData(categoryRegistrationForm);
  const eventId = String(formData.get("eventId") || "");
  const eventItem = state.events.find((item) => item.id === eventId);

  if (!eventItem) {
    showToast("Selecione um evento válido para vincular a categoria.", "error");
    return;
  }

  const capacity = Number(formData.get("capacity"));

  if (!Number.isInteger(capacity) || capacity <= 0) {
    showToast("Informe um número de vagas válido para a categoria.", "error");
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
  categoryRegistrationForm.reset();
  syncCategorySelection(eventId);
  render();
  focusCategoryNameField();
  showToast("Categoria adicionada ao evento selecionado.");
}

function handleCategoryEventChange() {
  syncCategorySelection(categoryEventSelect.value);
  renderManagementPage();
}

function handleRegistrationActions(event) {
  const actionButton = event.target.closest("[data-select-enrollment]");

  if (!actionButton) {
    return;
  }

  selectEnrollmentCategory(actionButton.dataset.eventId, actionButton.dataset.categoryId, true);
}

function handleEnrollmentSubmit(event) {
  event.preventDefault();

  const formData = new FormData(enrollmentForm);
  const eventId = String(formData.get("eventId") || "");
  const categoryId = String(formData.get("categoryId") || "");
  const found = findCategory(eventId, categoryId);

  if (!found) {
    showToast("Não foi possível encontrar a categoria selecionada.", "error");
    return;
  }

  if (isCategoryFull(found.category)) {
    showToast("As vagas desta categoria já foram preenchidas.", "warning");
    renderRegistrationPage();
    return;
  }

  const matricula = String(formData.get("matricula") || "").trim();
  const alreadyRegistered = found.category.subscriptions.some(
    (subscription) => subscription.matricula.toLowerCase() === matricula.toLowerCase(),
  );

  if (alreadyRegistered) {
    showToast("Esta matrícula já está inscrita nesta categoria.", "warning");
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
  clearEnrollmentFormFields();
  render();
  showToast("Inscrição realizada com sucesso.");
}

function handleLoadDemo() {
  const alreadyLoaded = state.events.some((eventItem) => eventItem.id === "demo-event");

  if (alreadyLoaded) {
    showToast("A demonstração já foi inserida neste navegador.", "warning");
    return;
  }

  const demoEvent = {
    id: "demo-event",
    name: "Jornada de Humanização Assistencial",
    start: buildFutureDate(3, 8, 30),
    end: buildFutureDate(3, 17, 30),
    managerId: "SCM-10248",
    sector: "Educação Continuada",
    createdAt: new Date().toISOString(),
    categories: [
      {
        id: "demo-cat-1",
        name: "Palestra Magna",
        capacity: 80,
        allowExternal: true,
        description:
          "Abertura institucional com foco em acolhimento, segurança do paciente e experiências humanizadas.",
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
        name: "Oficina de Comunicação com Familiares",
        capacity: 24,
        allowExternal: false,
        description:
          "Encontro prático para equipes assistenciais aperfeiçoarem comunicação sensível em situações críticas.",
        createdAt: new Date().toISOString(),
        subscriptions: [
          {
            id: "demo-sub-3",
            matricula: "30987",
            sector: "Serviço Social",
            contact: "social@santacasa.local",
            createdAt: new Date().toISOString(),
          },
        ],
      },
    ],
  };

  state.events = [demoEvent, ...state.events].sort(sortEventsByStart);
  persist();

  if (registrationList && !isValidEnrollmentSelection(state.selectedEnrollment)) {
    state.selectedEnrollment = { eventId: "demo-event", categoryId: "demo-cat-1" };
    updateEnrollmentUrl("demo-event", "demo-cat-1");
  }

  if (categoryEventSelect && !getRequestedManagementEventId()) {
    syncCategorySelection(demoEvent.id);
  }

  render();
  showToast("Demonstração inserida para facilitar a validação do layout.");
}

function render() {
  renderStats();
  renderEventsDashboard();
  renderManagementPage();
  renderRegistrationPage();
}

function renderStats() {
  if (!statsGrid) {
    return;
  }

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
    { value: totalSubscriptions, label: "Inscrições registradas" },
    { value: remainingSeats, label: "Vagas disponíveis" },
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

function renderEventsDashboard() {
  if (!eventsList || !emptyState) {
    return;
  }

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
          ? eventItem.categories.map((category) => renderDashboardCategoryCard(eventItem, category)).join("")
          : `<div class="empty-card">Nenhuma categoria cadastrada ainda para este evento.</div>`;

      return `
        <article class="event-card">
          <div class="event-card__header">
            <div>
              <span class="card-badge">Evento institucional</span>
              <h3 class="event-title">${escapeHtml(eventItem.name)}</h3>
              <p class="event-card__meta">
                ${escapeHtml(formatDateTime(eventItem.start))} até ${escapeHtml(formatDateTime(eventItem.end))}
              </p>
            </div>

            <div class="metric-pill">${formatCountLabel(eventItem.categories.length, "categoria", "categorias")}</div>
          </div>

          <div class="event-card__detail-list">
            <div class="detail-chip">Matrícula responsável: <strong>${escapeHtml(eventItem.managerId)}</strong></div>
            <div class="detail-chip">Setor responsável: <strong>${escapeHtml(eventItem.sector)}</strong></div>
          </div>

          <div class="event-card__body">
            <div class="category-stack">
              ${categoriesMarkup}
            </div>

            <div class="event-card__actions">
              <a class="button button--primary" href="${buildPageHref("cadastros", {
                searchParams: { eventId: eventItem.id },
                hash: "categorias",
              })}">
                Gerenciar categorias
              </a>
              <a class="button button--secondary" href="${PAGE_ROUTES.inscricoes}">Abrir inscrições</a>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderDashboardCategoryCard(eventItem, category) {
  const occupancy = getOccupancy(category);
  const remaining = Math.max(category.capacity - category.subscriptions.length, 0);

  return `
    <article class="category-card">
      <div class="category-card__head">
        <div>
          <h4>${escapeHtml(category.name)}</h4>
          <div class="tag-group">
            <span class="tag">${formatFractionLabel(category.subscriptions.length, category.capacity, "inscrição", "inscrições")}</span>
            <span class="tag ${category.allowExternal ? "" : "tag--accent"}">
              ${category.allowExternal ? "Inscrição externa permitida" : "Somente público interno"}
            </span>
            ${remaining === 0 ? '<span class="tag tag--full">Vagas esgotadas</span>' : ""}
          </div>
        </div>

        <span class="status-pill ${remaining > 0 ? "status-pill--success" : ""}">
          ${formatCountLabel(remaining, "vaga restante", "vagas restantes")}
        </span>
      </div>

      <p class="category-card__description">${escapeHtml(category.description)}</p>

      <div class="progress" aria-hidden="true">
        <div class="progress__bar" style="width: ${occupancy}%"></div>
      </div>

      <div class="category-card__actions">
        <a class="button button--ghost" href="${buildPageHref("inscricoes", {
          searchParams: { eventId: eventItem.id, categoryId: category.id },
        })}">
          Inscrever-se
        </a>
      </div>
    </article>
  `;
}

function renderManagementPage() {
  if (!categoryRegistrationForm || !categoryEventSelect || !categoryFieldset || !categoryFormEmptyState) {
    return;
  }

  const hasEvents = state.events.length > 0;
  const selectedEventId = hasEvents ? getRequestedManagementEventId() : "";

  if (!hasEvents) {
    categoryEventSelect.innerHTML = '<option value="">Nenhum evento cadastrado</option>';
    categoryFieldset.disabled = true;
    categoryFormEmptyState.hidden = false;
    if (categorySubmitButton) {
      categorySubmitButton.disabled = true;
    }
  } else {
    categoryEventSelect.innerHTML = state.events
      .map(
        (eventItem) => `
          <option value="${eventItem.id}">
            ${escapeHtml(eventItem.name)} | ${escapeHtml(formatShortDate(eventItem.start))}
          </option>
        `,
      )
      .join("");

    categoryEventSelect.value = selectedEventId;
    categoryFieldset.disabled = false;
    categoryFormEmptyState.hidden = true;
    if (categorySubmitButton) {
      categorySubmitButton.disabled = false;
    }
    updateManagementUrl(selectedEventId);
  }

  renderManagementSummary(selectedEventId);
}

function renderManagementSummary(selectedEventId) {
  if (!eventSummaryList) {
    return;
  }

  if (state.events.length === 0) {
    eventSummaryList.innerHTML = `
      <div class="empty-card">
        Nenhum evento cadastrado ainda. Use o formulário acima para criar o primeiro evento antes de abrir categorias.
      </div>
    `;
    return;
  }

  eventSummaryList.innerHTML = state.events
    .map((eventItem) => {
      const selectedClass = eventItem.id === selectedEventId ? " summary-card--selected" : "";
      const buttonClass = eventItem.id === selectedEventId ? "button button--primary" : "button button--ghost";
      const categoriesMarkup =
        eventItem.categories.length > 0
          ? eventItem.categories.map((category) => renderAdministrativeCategoryCard(category)).join("")
          : `<div class="empty-card">Nenhuma categoria cadastrada ainda para este evento.</div>`;

      return `
        <article class="summary-card${selectedClass}">
          <div class="summary-card__head">
            <div>
              <span class="card-badge">Evento disponível</span>
              <h3 class="event-title">${escapeHtml(eventItem.name)}</h3>
              <p class="summary-card__meta">
                ${escapeHtml(formatDateTime(eventItem.start))} até ${escapeHtml(formatDateTime(eventItem.end))}
              </p>
            </div>

            <span class="metric-pill">${formatCountLabel(eventItem.categories.length, "categoria", "categorias")}</span>
          </div>

          <div class="summary-card__body">
            ${categoriesMarkup}
          </div>

          <div class="summary-card__actions">
            <a class="${buttonClass}" href="${buildPageHref("cadastros", {
              searchParams: { eventId: eventItem.id },
              hash: "categorias",
            })}">
              ${eventItem.id === selectedEventId ? "Evento selecionado" : "Usar neste cadastro"}
            </a>
            <a class="button button--secondary" href="${PAGE_ROUTES.inscricoes}">Abrir inscrições</a>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderAdministrativeCategoryCard(category) {
  const occupancy = getOccupancy(category);
  const remaining = Math.max(category.capacity - category.subscriptions.length, 0);
  const subscriptionList =
    category.subscriptions.length > 0
      ? category.subscriptions
          .map(
            (subscription) => `
              <div class="subscription-item">
                <div>
                  <strong>Matrícula ${escapeHtml(subscription.matricula)}</strong>
                  <span>${escapeHtml(subscription.sector)}</span>
                </div>
                <small>${escapeHtml(subscription.contact)}</small>
              </div>
            `,
          )
          .join("")
      : `<div class="empty-card">Ainda não há inscritos nesta categoria.</div>`;

  return `
    <article class="category-card">
      <div class="category-card__head">
        <div>
          <h4>${escapeHtml(category.name)}</h4>
          <div class="tag-group">
            <span class="tag">${formatFractionLabel(category.subscriptions.length, category.capacity, "inscrição", "inscrições")}</span>
            <span class="tag ${category.allowExternal ? "" : "tag--accent"}">
              ${category.allowExternal ? "Inscrição externa permitida" : "Somente público interno"}
            </span>
            ${remaining === 0 ? '<span class="tag tag--full">Vagas esgotadas</span>' : ""}
          </div>
        </div>

        <span class="status-pill ${remaining > 0 ? "status-pill--success" : ""}">
          ${formatCountLabel(remaining, "vaga restante", "vagas restantes")}
        </span>
      </div>

      <p class="category-card__description">${escapeHtml(category.description)}</p>

      <div class="progress" aria-hidden="true">
        <div class="progress__bar" style="width: ${occupancy}%"></div>
      </div>

      <p class="category-card__subheading">Participantes inscritos</p>

      <div class="subscription-list">
        ${subscriptionList}
      </div>
    </article>
  `;
}

function renderRegistrationPage() {
  if (!registrationList || !registrationEmptyState) {
    return;
  }

  const eventsWithCategories = state.events.filter((eventItem) => eventItem.categories.length > 0);

  if (eventsWithCategories.length === 0) {
    registrationList.innerHTML = "";
    registrationEmptyState.hidden = false;
    state.selectedEnrollment = null;
    renderEnrollmentWorkspace();
    return;
  }

  registrationEmptyState.hidden = true;

  if (!isValidEnrollmentSelection(state.selectedEnrollment)) {
    const firstCategory = getFirstCategorySelection();

    if (firstCategory) {
      state.selectedEnrollment = firstCategory;
      updateEnrollmentUrl(firstCategory.eventId, firstCategory.categoryId);
    }
  }

  registrationList.innerHTML = eventsWithCategories
    .map((eventItem) => {
      const categoriesMarkup = eventItem.categories.map((category) => renderRegistrationCategoryCard(eventItem, category)).join("");

      return `
        <article class="registration-card">
          <div class="registration-card__header">
            <div>
              <span class="card-badge">Inscrições abertas</span>
              <h3 class="event-title">${escapeHtml(eventItem.name)}</h3>
              <p class="registration-card__meta">
                ${escapeHtml(formatDateTime(eventItem.start))} até ${escapeHtml(formatDateTime(eventItem.end))}
              </p>
            </div>

            <span class="metric-pill">${formatCountLabel(eventItem.categories.length, "opção", "opções")}</span>
          </div>

          <div class="registration-card__detail-list">
            <div class="detail-chip">Setor responsável: <strong>${escapeHtml(eventItem.sector)}</strong></div>
            <div class="detail-chip">Responsável: <strong>${escapeHtml(eventItem.managerId)}</strong></div>
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

  renderEnrollmentWorkspace();
}

function renderRegistrationCategoryCard(eventItem, category) {
  const remaining = Math.max(category.capacity - category.subscriptions.length, 0);
  const full = remaining === 0;
  const selected =
    state.selectedEnrollment &&
    state.selectedEnrollment.eventId === eventItem.id &&
    state.selectedEnrollment.categoryId === category.id;

  return `
    <article class="category-card category-card--public${selected ? " category-card--selected" : ""}">
      <div class="category-card__head">
        <div>
          <h4>${escapeHtml(category.name)}</h4>
          <div class="tag-group">
            <span class="tag">${formatFractionLabel(category.subscriptions.length, category.capacity, "ocupada", "ocupadas")}</span>
            <span class="tag ${category.allowExternal ? "" : "tag--accent"}">
              ${category.allowExternal ? "Aceita inscrições externas" : "Inscrição interna"}
            </span>
          </div>
        </div>

        <span class="status-pill ${full ? "" : "status-pill--success"}">
          ${full ? "Lotado" : formatCountLabel(remaining, "vaga", "vagas")}
        </span>
      </div>

      <p class="category-card__description">${escapeHtml(category.description)}</p>

      <div class="progress" aria-hidden="true">
        <div class="progress__bar" style="width: ${getOccupancy(category)}%"></div>
      </div>

      <div class="public-category-actions">
        <div class="tag-group">
          <span class="tag">Evento: ${escapeHtml(eventItem.name)}</span>
          <span class="tag">Início ${escapeHtml(formatShortDate(eventItem.start))}</span>
        </div>

        <button
          class="button ${selected ? "button--primary" : "button--ghost"}"
          type="button"
          data-select-enrollment="true"
          data-event-id="${eventItem.id}"
          data-category-id="${category.id}"
        >
          ${full ? "Ver categoria" : selected ? "Categoria selecionada" : "Selecionar categoria"}
        </button>
      </div>
    </article>
  `;
}

function renderEnrollmentWorkspace() {
  if (
    !enrollmentForm ||
    !enrollmentFieldset ||
    !enrollmentSelectionTitle ||
    !enrollmentSelectionMeta ||
    !enrollmentSelectionTags ||
    !enrollmentStatusNote
  ) {
    return;
  }

  const found = isValidEnrollmentSelection(state.selectedEnrollment)
    ? findCategory(state.selectedEnrollment.eventId, state.selectedEnrollment.categoryId)
    : null;

  if (!found) {
    enrollmentForm.elements.eventId.value = "";
    enrollmentForm.elements.categoryId.value = "";
    enrollmentFieldset.disabled = true;
    enrollmentSelectionTitle.textContent = "Escolha uma categoria";
    enrollmentSelectionMeta.textContent = "Selecione uma categoria na lista ao lado para liberar o formulário de inscrição.";
    enrollmentSelectionTags.innerHTML = "";
    enrollmentStatusNote.textContent = "Selecione uma categoria para começar.";
    return;
  }

  const remaining = Math.max(found.category.capacity - found.category.subscriptions.length, 0);
  const full = remaining === 0;

  enrollmentForm.elements.eventId.value = found.event.id;
  enrollmentForm.elements.categoryId.value = found.category.id;
  enrollmentSelectionTitle.textContent = found.category.name;
  enrollmentSelectionMeta.textContent =
    `${found.event.name} | ${formatDateTime(found.event.start)} até ${formatDateTime(found.event.end)}`;
  enrollmentSelectionTags.innerHTML = `
    <span class="tag">${formatFractionLabel(found.category.subscriptions.length, found.category.capacity, "ocupada", "ocupadas")}</span>
    <span class="tag ${found.category.allowExternal ? "" : "tag--accent"}">
      ${found.category.allowExternal ? "Aceita inscrições externas" : "Somente público interno"}
    </span>
  `;

  enrollmentFieldset.disabled = full;
  enrollmentStatusNote.textContent = full
    ? "Esta categoria está lotada no momento. Escolha outra categoria para realizar a inscrição."
    : `${formatCountLabel(remaining, "vaga restante", "vagas restantes")}. Preencha os dados do participante para concluir a inscrição.`;
}

function getRequestedManagementEventId() {
  const requestedId = new URLSearchParams(window.location.search).get("eventId");

  if (requestedId && state.events.some((eventItem) => eventItem.id === requestedId)) {
    return requestedId;
  }

  if (categoryEventSelect && state.events.some((eventItem) => eventItem.id === categoryEventSelect.value)) {
    return categoryEventSelect.value;
  }

  return state.events[0] ? state.events[0].id : "";
}

function syncCategorySelection(eventId) {
  if (!categoryEventSelect) {
    return;
  }

  const validEventId = state.events.some((eventItem) => eventItem.id === eventId)
    ? eventId
    : state.events[0]
      ? state.events[0].id
      : "";

  categoryEventSelect.value = validEventId;
  updateManagementUrl(validEventId);
}

function updateManagementUrl(eventId) {
  if (!categoryEventSelect) {
    return;
  }

  try {
    const url = new URL(window.location.href);

    if (eventId) {
      url.searchParams.set("eventId", eventId);
    } else {
      url.searchParams.delete("eventId");
    }

    history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  } catch (error) {
    console.error(error);
  }
}

function getRequestedEnrollmentSelection() {
  const params = new URLSearchParams(window.location.search);
  const eventId = params.get("eventId");
  const categoryId = params.get("categoryId");

  if (!eventId || !categoryId) {
    return null;
  }

  return isValidEnrollmentPair(eventId, categoryId) ? { eventId, categoryId } : null;
}

function selectEnrollmentCategory(eventId, categoryId, resetForm) {
  if (!isValidEnrollmentPair(eventId, categoryId)) {
    return;
  }

  state.selectedEnrollment = { eventId, categoryId };
  updateEnrollmentUrl(eventId, categoryId);

  if (resetForm) {
    clearEnrollmentFormFields();
  }

  renderRegistrationPage();
}

function updateEnrollmentUrl(eventId, categoryId) {
  if (!registrationList) {
    return;
  }

  try {
    const url = new URL(window.location.href);
    url.searchParams.set("eventId", eventId);
    url.searchParams.set("categoryId", categoryId);
    history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  } catch (error) {
    console.error(error);
  }
}

function isValidEnrollmentPair(eventId, categoryId) {
  return Boolean(findCategory(eventId, categoryId));
}

function isValidEnrollmentSelection(selection) {
  return Boolean(selection && isValidEnrollmentPair(selection.eventId, selection.categoryId));
}

function getFirstCategorySelection() {
  for (const eventItem of state.events) {
    if (eventItem.categories.length > 0) {
      return { eventId: eventItem.id, categoryId: eventItem.categories[0].id };
    }
  }

  return null;
}

function clearEnrollmentFormFields() {
  if (!enrollmentForm) {
    return;
  }

  const eventId = enrollmentForm.elements.eventId.value;
  const categoryId = enrollmentForm.elements.categoryId.value;
  enrollmentForm.reset();
  enrollmentForm.elements.eventId.value = eventId;
  enrollmentForm.elements.categoryId.value = categoryId;
}

function focusCategoryNameField() {
  if (!categoryRegistrationForm) {
    return;
  }

  const categoryNameField = categoryRegistrationForm.querySelector('input[name="name"]');

  if (categoryNameField) {
    categoryNameField.focus();
  }
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

function getPluralLabel(count, singular, plural) {
  return Math.abs(count) === 1 ? singular : plural;
}

function formatCountLabel(count, singular, plural) {
  return `${count} ${getPluralLabel(count, singular, plural)}`;
}

function formatFractionLabel(current, total, singular, plural) {
  return `${current}/${total} ${getPluralLabel(current, singular, plural)}`;
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
    showToast("Não foi possível salvar os dados no navegador.", "error");
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
  const categories = Array.isArray(eventItem && eventItem.categories) ? eventItem.categories.map(normalizeCategory) : [];

  return {
    id: String((eventItem && eventItem.id) || createId("evt")),
    name: String((eventItem && eventItem.name) || "Evento sem nome"),
    start: String((eventItem && eventItem.start) || ""),
    end: String((eventItem && eventItem.end) || ""),
    managerId: String((eventItem && eventItem.managerId) || ""),
    sector: String((eventItem && eventItem.sector) || ""),
    createdAt: String((eventItem && eventItem.createdAt) || new Date().toISOString()),
    categories,
  };
}

function normalizeCategory(category) {
  const subscriptions = Array.isArray(category && category.subscriptions)
    ? category.subscriptions.map((subscription) => ({
        id: String((subscription && subscription.id) || createId("sub")),
        matricula: String((subscription && subscription.matricula) || ""),
        sector: String((subscription && subscription.sector) || ""),
        contact: String((subscription && subscription.contact) || ""),
        createdAt: String((subscription && subscription.createdAt) || new Date().toISOString()),
      }))
    : [];

  return {
    id: String((category && category.id) || createId("cat")),
    name: String((category && category.name) || "Categoria sem nome"),
    capacity: Math.max(Number(category && category.capacity) || 0, 0),
    allowExternal: Boolean(category && category.allowExternal),
    description: String((category && category.description) || ""),
    createdAt: String((category && category.createdAt) || new Date().toISOString()),
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
  if (!toastStack) {
    return;
  }

  const toast = document.createElement("div");
  toast.className = `toast ${tone === "success" ? "" : `toast--${tone}`}`.trim();
  toast.textContent = message;
  toastStack.append(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 4200);
}

