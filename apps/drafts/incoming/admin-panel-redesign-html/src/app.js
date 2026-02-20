(function () {
  const modules = [
    { id: "website-builder", name: "Website Builder", icon: "🏗️" },
    { id: "ecommerce", name: "Ecommerce", icon: "🛍️" },
    { id: "billing", name: "Billing", icon: "💳" },
    { id: "blog", name: "Blog", icon: "📝" },
    { id: "rbac", name: "RBAC", icon: "🔐" },
  ];

  const models = {
    "website-builder": ["layout", "metadata", "page", "widget"],
    ecommerce: [
      "attribute",
      "attribute-key",
      "category",
      "order",
      "product",
      "store",
      "widget",
      "products-to-attributes",
      "orders-to-products",
    ],
    billing: ["invoice", "payment", "subscription"],
    blog: ["article", "author", "category", "products-to-articles"],
    rbac: ["role", "permission", "subject"],
  };

  const mockProducts = [
    {
      id: "e939ed88-22ba-4630-b6d5-d2802c9f5bce",
      adminTitle: "Pro Subscription",
      title: "Pro Subscription",
      titleRu: "Подписка Про",
      shortDescription: "Pro subscription for getting all the features",
      shortDescriptionRu: "Подписка для получения доступа к нейронным сетям",
      slug: "pro",
      variant: "default",
      type: "subscription",
    },
    {
      id: "2a167247-3770-4365-8b8a-19935ab2b15f",
      adminTitle: "Free Subscription",
      title: "Free Tier",
      titleRu: "Бесплатный",
      shortDescription: "Free subscription with limited features",
      shortDescriptionRu: "Бесплатная подписка",
      slug: "free-subscription",
      variant: "default",
      type: "subscription",
    },
    {
      id: "e13709ae-58ea-416f-b6d5-d2802c9f5bce",
      adminTitle: "product-e13709ae-58ea-416f-b6d5-d2802c9f5bce",
      title: "Website",
      titleRu: "Веб-сайт",
      shortDescription: "Professional website builder",
      shortDescriptionRu: "Профессиональный конструктор сайтов",
      slug: "website",
      variant: "default",
      type: "product",
    },
    {
      id: "bb2473b0-9b2e-4dd2-bd32-f29f7a4d0b3b",
      adminTitle: "Startup",
      title: "Startup",
      titleRu: "Стартап",
      shortDescription: "Perfect for startups",
      shortDescriptionRu: "Идеально для стартапов",
      slug: "startup",
      variant: "default",
      type: "product",
    },
    {
      id: "6f43f39d-5f5d-4ef6-91a4-f95ec01b4f11",
      adminTitle: "Enterprise Suite",
      title: "Enterprise",
      titleRu: "Энтерпрайз",
      shortDescription: "Advanced package for large teams",
      shortDescriptionRu: "Пакет для крупных команд",
      slug: "enterprise",
      variant: "default",
      type: "subscription",
    },
  ];

  const modelEntities = {
    product: mockProducts,
    attribute: [
      {
        id: "7a8a437a-ae24-4fae-bf1e-cd0820f31610",
        adminTitle: "String Attribute",
        title: "String",
        slug: "string",
        variant: "default",
        type: "attribute",
      },
      {
        id: "386e253f-640d-4e81-9121-ef11294a1750",
        adminTitle: "Number Attribute",
        title: "Number",
        slug: "number",
        variant: "default",
        type: "attribute",
      },
    ],
    role: [
      {
        id: "e903f3d7-2aa8-45a5-8687-873a3c057401",
        adminTitle: "Admin",
        title: "Admin",
        slug: "admin",
        type: "role",
      },
      {
        id: "4b043267-cb8c-438a-bfae-fad8db9f80c0",
        adminTitle: "User",
        title: "User",
        slug: "user",
        type: "role",
      },
    ],
    permission: [
      {
        id: "1949cdab-4828-4ef8-b1de-0b35f3f24631",
        adminTitle: "Get Orders",
        title: "/api/rbac/subjects/[id]/ecommerce-module/orders | GET | HTTP",
        slug: "orders-get",
        type: "permission",
      },
      {
        id: "5cfa37e0-53ef-4f8b-a849-5af8088a5d9d",
        adminTitle: "Update Product",
        title: "/api/ecommerce/products/[id] | PATCH | HTTP",
        slug: "products-patch",
        type: "permission",
      },
    ],
    article: [
      {
        id: "abc123",
        adminTitle: "How to choose a subscription plan",
        title: "How to choose a subscription plan",
        slug: "choose-subscription",
        type: "article",
      },
      {
        id: "def456",
        adminTitle: "Getting started with our platform",
        title: "Getting started with our platform",
        slug: "getting-started",
        type: "article",
      },
    ],
  };

  const mockAttributes = [
    { id: "7a8a437aae24faeb", title: "String", number: 0, type: "String" },
    { id: "386e253f-640d-4e81", title: "Number", number: 590, type: "Number" },
    { id: "abc-def-ghi-jkl", title: "Boolean", number: 990, type: "Boolean" },
    { id: "mno-pqr-stu-vwx", title: "Datetime", number: 510, type: "Datetime" },
  ];

  const mockArticles = [
    {
      id: "abc123",
      title: "How to choose a subscription plan",
      slug: "choose-subscription",
    },
    {
      id: "def456",
      title: "Getting started with our platform",
      slug: "getting-started",
    },
    {
      id: "ghi789",
      title: "Advanced features guide",
      slug: "advanced-features",
    },
  ];

  const initialRelations = {
    "products-to-attributes": [
      {
        id: "7f413699-39e9-465a",
        orderIndex: 0,
        className: "",
        variant: "default",
        attribute: {
          id: "7a8a437aae24faeb",
          title: "String",
          number: 0,
        },
      },
      {
        id: "578a214d-3efa-4e87",
        orderIndex: 1,
        className: "",
        variant: "default",
        attribute: {
          id: "386e253f-640d-4e81",
          title: "Number",
          number: 590,
        },
      },
    ],
    "products-to-articles": [
      {
        id: "a1b2c3d4-e5f6-7890",
        orderIndex: 0,
        article: {
          id: "abc123",
          title: "How to choose a subscription plan",
          slug: "choose-subscription",
        },
      },
    ],
  };

  const state = {
    sidebarOpen: true,
    selectedModule: "ecommerce",
    selectedModel: "product",
    modelSearch: "",
    entitySearch: "",
    sortBy: "id",
    currentPage: 1,
    itemsPerPage: 4,
    drawerStack: [],
    relationEditor: {
      open: false,
      mode: "create",
      relationType: "",
      targetRelationId: null,
      ownerDepth: null,
      formData: null,
    },
    confirmDialog: {
      open: false,
      actionType: "",
      title: "",
      description: "",
      confirmLabel: "Delete",
      payload: null,
    },
  };

  const dom = {
    sidebar: document.getElementById("sidebar"),
    toggleSidebarButton: document.getElementById("toggleSidebarButton"),
    modelSearchInput: document.getElementById("modelSearchInput"),
    modelsList: document.getElementById("modelsList"),
    modulesNav: document.getElementById("modulesNav"),
    breadcrumb: document.getElementById("breadcrumb"),
    pageTitle: document.getElementById("pageTitle"),
    entitySearchInput: document.getElementById("entitySearchInput"),
    sortSelect: document.getElementById("sortSelect"),
    addNewButton: document.getElementById("addNewButton"),
    entityList: document.getElementById("entityList"),
    paginationPanel: document.getElementById("paginationPanel"),
    entityDrawer: document.getElementById("entityDrawer"),
    entityDrawerBackdrop: document.getElementById("entityDrawerBackdrop"),
    relationDrawer: document.getElementById("relationDrawer"),
    relationDrawerBackdrop: document.getElementById("relationDrawerBackdrop"),
    confirmDialog: document.getElementById("confirmDialog"),
    confirmDialogBackdrop: document.getElementById("confirmDialogBackdrop"),
  };
  const copyFeedbackTimers = new WeakMap();

  function cloneValue(value) {
    if (typeof structuredClone === "function") {
      return structuredClone(value);
    }

    return JSON.parse(JSON.stringify(value));
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatLabel(value) {
    return value
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  function testIdPart(value) {
    return String(value ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function tid(prefix, ...parts) {
    return [prefix, ...parts.map(testIdPart)].filter(Boolean).join("--");
  }

  function generateId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }

    return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function getCurrentModuleModels() {
    return models[state.selectedModule] || [];
  }

  function getEntitiesByModel(modelName) {
    return modelEntities[modelName] || [];
  }

  function getCurrentEntities() {
    return getEntitiesByModel(state.selectedModel);
  }

  function getModuleIdByModel(modelName) {
    const match = modules.find((moduleItem) =>
      (models[moduleItem.id] || []).includes(modelName),
    );
    return match?.id || null;
  }

  function getTopPanelDepth() {
    return state.drawerStack.length - 1;
  }

  function getPanelByDepth(depth) {
    return state.drawerStack[depth] || null;
  }

  function getTopPanel() {
    return getPanelByDepth(getTopPanelDepth());
  }

  function getRelationListByType(panel, relationType) {
    if (!panel.relations[relationType]) {
      panel.relations[relationType] = [];
    }

    return panel.relations[relationType];
  }

  function ensureRelationPaging(panel, relationType) {
    if (!panel.relationPaging) {
      panel.relationPaging = {};
    }

    if (!panel.relationPaging[relationType]) {
      panel.relationPaging[relationType] = {
        currentPage: 1,
        itemsPerPage: 1,
      };
    }

    const paging = panel.relationPaging[relationType];
    const parsedItemsPerPage = Number(paging.itemsPerPage);
    paging.itemsPerPage = Number.isFinite(parsedItemsPerPage)
      ? Math.max(1, parsedItemsPerPage)
      : 1;

    const totalItems = getRelationListByType(panel, relationType).length;
    const totalPages = Math.max(1, Math.ceil(totalItems / paging.itemsPerPage));
    paging.currentPage = Math.max(
      1,
      Math.min(totalPages, Number(paging.currentPage || 1)),
    );

    return paging;
  }

  function getRelationPageData(panel, relationType) {
    const list = getRelationListByType(panel, relationType);
    const paging = ensureRelationPaging(panel, relationType);
    const totalItems = list.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / paging.itemsPerPage));
    const startIndex = (paging.currentPage - 1) * paging.itemsPerPage;
    const items = list.slice(startIndex, startIndex + paging.itemsPerPage);

    return {
      list,
      items,
      startIndex,
      totalItems,
      totalPages,
      currentPage: paging.currentPage,
      itemsPerPage: paging.itemsPerPage,
    };
  }

  function applyCopyFeedback(target) {
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.getAttribute("data-copy-feedback") !== "id") {
      return;
    }

    if (!target.dataset.originalClass) {
      target.dataset.originalClass = target.className;
    }

    const existingTimer = copyFeedbackTimers.get(target);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    target.className = `${target.dataset.originalClass} border-emerald-500 bg-emerald-100 text-emerald-700`;

    const timer = setTimeout(() => {
      target.className = target.dataset.originalClass || target.className;
      copyFeedbackTimers.delete(target);
    }, 1000);

    copyFeedbackTimers.set(target, timer);
  }

  function copyToClipboard(value, triggerElement) {
    if (!value) {
      return;
    }

    const copyText = String(value);

    const legacyCopy = () => {
      const textarea = document.createElement("textarea");
      textarea.value = copyText;
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textarea);
      return success;
    };

    const onCopySuccess = () => applyCopyFeedback(triggerElement);

    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(copyText)
        .then(onCopySuccess)
        .catch(() => {
          if (legacyCopy()) {
            onCopySuccess();
          }
        });
      return;
    }

    if (legacyCopy()) {
      onCopySuccess();
    }
  }

  function ensureModelInModule() {
    const currentModels = getCurrentModuleModels();
    if (!currentModels.includes(state.selectedModel)) {
      state.selectedModel = currentModels[0] || "";
    }
  }

  function setBackdropVisible(backdrop, visible) {
    if (visible) {
      backdrop.classList.remove("pointer-events-none", "opacity-0");
      backdrop.classList.add("opacity-100");
      return;
    }

    backdrop.classList.add("pointer-events-none", "opacity-0");
    backdrop.classList.remove("opacity-100");
  }

  function setDrawerVisibility(drawer, visible) {
    if (visible) {
      drawer.classList.remove("translate-x-full");
      return;
    }

    drawer.classList.add("translate-x-full");
  }

  function buildPanel(entity, modelName, moduleId) {
    return {
      moduleId,
      modelName,
      entityId: entity.id,
      formData: cloneValue(entity),
      activeTab: "details",
      activeRelationTab: "products-to-attributes",
      relations: cloneValue(initialRelations),
      relationPaging: {
        "products-to-attributes": {
          currentPage: 1,
          itemsPerPage: 1,
        },
        "products-to-articles": {
          currentPage: 1,
          itemsPerPage: 1,
        },
      },
    };
  }

  function openEntityPanel(entity, options) {
    const panel = buildPanel(entity, options.modelName, options.moduleId);

    if (options.append) {
      state.drawerStack.push(panel);
    } else {
      state.drawerStack = [panel];
    }

    closeRelationDrawer(false);
    render();
  }

  function openEntityEditorById(id, options) {
    const modelName = options?.modelName || state.selectedModel;
    const moduleId = options?.moduleId || state.selectedModule;
    const append = Boolean(options?.append);

    const entity = getEntitiesByModel(modelName).find((item) => item.id === id);
    if (!entity) {
      return;
    }

    openEntityPanel(entity, {
      append,
      modelName,
      moduleId,
    });
  }

  function closeTopEntityPanel() {
    if (!state.drawerStack.length) {
      return;
    }

    const topDepth = getTopPanelDepth();
    state.drawerStack.pop();

    if (
      state.relationEditor.open &&
      state.relationEditor.ownerDepth >= topDepth
    ) {
      closeRelationDrawer(false);
    }

    render();
  }

  function getAvailableRelationEntities(relationType) {
    if (relationType === "products-to-attributes") {
      return mockAttributes;
    }

    return mockArticles;
  }

  function getRelationEntityLabel(relationType, entity) {
    if (relationType === "products-to-attributes") {
      return `${entity.title} | ${entity.type || ""} | Number: ${entity.number}`;
    }

    return `${entity.title} | ${entity.slug}`;
  }

  function openRelationDrawer(options) {
    const ownerDepth =
      typeof options?.panelDepth === "number"
        ? options.panelDepth
        : getTopPanelDepth();
    const panel = getPanelByDepth(ownerDepth);
    if (!panel) {
      return;
    }

    const relationType = options.relationType;
    const list = getRelationListByType(panel, relationType);

    if (options.mode === "edit") {
      const item = list.find((row) => row.id === options.relationId);
      if (!item) {
        return;
      }

      state.relationEditor = {
        open: true,
        mode: "edit",
        relationType,
        targetRelationId: options.relationId,
        ownerDepth,
        formData: {
          orderIndex: item.orderIndex ?? 0,
          className: item.className || "",
          variant: item.variant || "default",
          selectedEntityId:
            relationType === "products-to-attributes"
              ? item.attribute?.id || ""
              : item.article?.id || "",
        },
      };
      render();
      return;
    }

    state.relationEditor = {
      open: true,
      mode: "create",
      relationType,
      targetRelationId: null,
      ownerDepth,
      formData: {
        orderIndex: list.length,
        className: "",
        variant: "default",
        selectedEntityId: "",
      },
    };

    render();
  }

  function closeRelationDrawer(shouldRender = true) {
    state.relationEditor = {
      open: false,
      mode: "create",
      relationType: "",
      targetRelationId: null,
      ownerDepth: null,
      formData: null,
    };

    if (shouldRender) {
      render();
    }
  }

  function saveEntity() {
    const panel = getTopPanel();
    if (!panel) {
      return;
    }

    const entities = getEntitiesByModel(panel.modelName);
    const idx = entities.findIndex((item) => item.id === panel.entityId);

    if (idx > -1) {
      entities[idx] = {
        ...entities[idx],
        ...panel.formData,
      };
    }

    closeTopEntityPanel();
  }

  function saveRelation() {
    const rel = state.relationEditor;
    if (!rel.open || !rel.formData) {
      return;
    }

    const panel = getPanelByDepth(rel.ownerDepth);
    if (!panel) {
      closeRelationDrawer();
      return;
    }

    const list = getRelationListByType(panel, rel.relationType);
    const available = getAvailableRelationEntities(rel.relationType);
    const selectedEntity = available.find(
      (item) => item.id === rel.formData.selectedEntityId,
    );

    if (rel.mode === "create" && !selectedEntity) {
      return;
    }

    if (rel.mode === "create") {
      const newRelation = {
        id: generateId(),
        orderIndex: Number(rel.formData.orderIndex || 0),
      };

      if (rel.relationType === "products-to-attributes") {
        newRelation.className = rel.formData.className || "";
        newRelation.variant = rel.formData.variant || "default";
        newRelation.attribute = {
          id: selectedEntity.id,
          title: selectedEntity.title,
          number: selectedEntity.number,
        };
      } else {
        newRelation.article = {
          id: selectedEntity.id,
          title: selectedEntity.title,
          slug: selectedEntity.slug,
        };
      }

      list.push(newRelation);
    } else {
      const idx = list.findIndex((item) => item.id === rel.targetRelationId);
      if (idx > -1) {
        const current = list[idx];
        current.orderIndex = Number(rel.formData.orderIndex || 0);

        if (rel.relationType === "products-to-attributes") {
          current.className = rel.formData.className || "";
          current.variant = rel.formData.variant || "default";
        }
      }
    }

    list.sort((a, b) => Number(a.orderIndex || 0) - Number(b.orderIndex || 0));
    list.forEach((item, index) => {
      item.orderIndex = index;
    });
    closeRelationDrawer();
  }

  function moveRelation(panelDepth, relationType, relationId, direction) {
    const panel = getPanelByDepth(panelDepth);
    if (!panel) {
      return;
    }

    const list = getRelationListByType(panel, relationType);
    const currentIndex = list.findIndex((item) => item.id === relationId);
    if (currentIndex < 0) {
      return;
    }

    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= list.length) {
      return;
    }

    const temp = list[currentIndex];
    list[currentIndex] = list[targetIndex];
    list[targetIndex] = temp;

    list.forEach((item, idx) => {
      item.orderIndex = idx;
    });

    render();
  }

  function deleteRelation(
    panelDepth,
    relationType,
    relationId,
    shouldRender = true,
  ) {
    const panel = getPanelByDepth(panelDepth);
    if (!panel) {
      return;
    }

    const next = getRelationListByType(panel, relationType).filter(
      (item) => item.id !== relationId,
    );
    panel.relations[relationType] = next.map((item, index) => ({
      ...item,
      orderIndex: index,
    }));

    if (shouldRender) {
      render();
    }
  }

  function openConfirmDialog(config) {
    state.confirmDialog = {
      open: true,
      actionType: config.actionType || "",
      title: config.title || "Confirm action",
      description: config.description || "",
      confirmLabel: config.confirmLabel || "Delete",
      payload: config.payload || null,
    };

    render();
  }

  function closeConfirmDialog(shouldRender = true) {
    state.confirmDialog = {
      open: false,
      actionType: "",
      title: "",
      description: "",
      confirmLabel: "Delete",
      payload: null,
    };

    if (shouldRender) {
      render();
    }
  }

  function confirmDelete() {
    const confirmState = state.confirmDialog;
    if (!confirmState.open) {
      return;
    }

    if (confirmState.actionType === "entity-delete" && confirmState.payload) {
      const { modelName, id } = confirmState.payload;
      const entities = getEntitiesByModel(modelName);
      const index = entities.findIndex((item) => item.id === id);
      if (index > -1) {
        entities.splice(index, 1);
      }

      state.drawerStack = state.drawerStack.filter(
        (panel) => !(panel.modelName === modelName && panel.entityId === id),
      );

      if (state.relationEditor.open && !state.drawerStack.length) {
        closeRelationDrawer(false);
      }
    }

    if (confirmState.actionType === "relation-delete" && confirmState.payload) {
      const { panelDepth, relationType, relationId } = confirmState.payload;
      deleteRelation(panelDepth, relationType, relationId, false);
    }

    closeConfirmDialog(false);
    render();
  }

  function ensureEntityForRelated(modelName, id) {
    if (!modelEntities[modelName]) {
      modelEntities[modelName] = [];
    }

    let entity = modelEntities[modelName].find((item) => item.id === id);
    if (entity) {
      return entity;
    }

    entity = {
      id,
      adminTitle: `${formatLabel(modelName)} - ${id.slice(0, 8)}`,
      title: `Sample ${formatLabel(modelName)}`,
      titleRu: `Пример ${formatLabel(modelName)}`,
      shortDescription: "Auto-generated nested entity preview",
      shortDescriptionRu: "Автоматически созданный превью объект",
      slug: modelName.toLowerCase(),
      type: modelName.toLowerCase(),
      variant: "default",
    };

    modelEntities[modelName].push(entity);
    return entity;
  }

  function openRelatedEntity(payload) {
    const entity = ensureEntityForRelated(payload.model, payload.id);
    const moduleId = getModuleIdByModel(payload.model) || state.selectedModule;

    openEntityPanel(entity, {
      append: true,
      modelName: payload.model,
      moduleId,
    });
  }

  function renderSidebar() {
    dom.sidebar.classList.toggle("w-64", state.sidebarOpen);
    dom.sidebar.classList.toggle("w-0", !state.sidebarOpen);
    dom.sidebar.classList.toggle("overflow-hidden", !state.sidebarOpen);

    const icon = state.sidebarOpen ? "panel-left-close" : "panel-left-open";
    dom.toggleSidebarButton.innerHTML = `<i data-lucide="${icon}" class="h-5 w-5"></i>`;

    const filtered = getCurrentModuleModels().filter((modelName) =>
      modelName.toLowerCase().includes(state.modelSearch.toLowerCase()),
    );

    if (!filtered.length) {
      dom.modelsList.innerHTML = `
        <div class="rounded-md border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          No models found.
        </div>
      `;
      return;
    }

    dom.modelsList.innerHTML = filtered
      .map((modelName) => {
        const isSelected = modelName === state.selectedModel;
        return `
          <button
            type="button"
            data-action="select-model"
            data-model="${escapeHtml(modelName)}"
            data-testid="${escapeHtml(tid("model-item", modelName))}"
            class="mb-1 block w-full truncate rounded-md px-3 py-2 text-left text-sm transition ${
              isSelected ? "bg-accent font-medium" : "hover:bg-muted"
            }"
          >
            ${escapeHtml(modelName)}
          </button>
        `;
      })
      .join("");
  }

  function renderModules() {
    dom.modulesNav.innerHTML = modules
      .map((moduleItem, index) => {
        const isSelected = moduleItem.id === state.selectedModule;
        return `
          <div class="flex items-center">
            ${
              index > 0
                ? '<i data-lucide="chevron-right" class="mx-1 h-4 w-4 text-muted-foreground"></i>'
                : ""
            }
            <button
              type="button"
              data-action="select-module"
              data-module="${escapeHtml(moduleItem.id)}"
              data-testid="${escapeHtml(tid("module-item", moduleItem.id))}"
              class="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${
                isSelected ? "bg-accent font-medium" : "hover:bg-muted"
              }"
            >
              <span>${moduleItem.icon}</span>
              <span>${escapeHtml(moduleItem.name)}</span>
            </button>
          </div>
        `;
      })
      .join("");
  }

  function renderHeader() {
    const currentModule = modules.find(
      (item) => item.id === state.selectedModule,
    );

    dom.breadcrumb.innerHTML = `
      <span>${escapeHtml(currentModule?.name || "")}</span>
      <i data-lucide="chevron-right" class="h-4 w-4"></i>
      <span class="font-medium text-foreground">${escapeHtml(state.selectedModel)}</span>
    `;

    dom.pageTitle.textContent = state.selectedModel;
  }

  function getFilteredEntities() {
    const searchLower = state.entitySearch.trim().toLowerCase();
    const sorted = [...getCurrentEntities()];

    sorted.sort((a, b) => {
      if (state.sortBy === "title") {
        return (a.adminTitle || a.title || "")
          .toString()
          .localeCompare((b.adminTitle || b.title || "").toString());
      }

      if (state.sortBy === "slug") {
        return (a.slug || "")
          .toString()
          .localeCompare((b.slug || "").toString());
      }

      return (a.id || "").toString().localeCompare((b.id || "").toString());
    });

    if (!searchLower) {
      return sorted;
    }

    return sorted.filter((entity) => {
      return [
        entity.id,
        entity.adminTitle,
        entity.title,
        entity.slug,
        entity.shortDescription,
        entity.shortDescriptionRu,
      ]
        .filter(Boolean)
        .some((value) => value.toString().toLowerCase().includes(searchLower));
    });
  }

  function renderEntityList() {
    const entities = getFilteredEntities();
    const totalPages = Math.max(
      1,
      Math.ceil(entities.length / state.itemsPerPage),
    );
    if (state.currentPage > totalPages) {
      state.currentPage = totalPages;
    }

    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const items = entities.slice(startIndex, startIndex + state.itemsPerPage);

    if (!items.length) {
      dom.entityList.innerHTML = `
        <div class="rounded-lg border border-dashed border-border bg-surface p-20 text-center text-4xl text-muted-foreground/60">
          No found items.
        </div>
      `;
      return;
    }

    dom.entityList.innerHTML = items
      .map((entity) => {
        return `
          <article
            data-testid="${escapeHtml(tid("entity-card", state.selectedModel, entity.id))}"
            class="rounded-lg border border-slate-300 bg-surface p-5 transition hover:border-slate-400 hover:shadow-md"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0 flex-1 space-y-3">
                <div>
                  <div class="mb-2 flex items-center gap-3">
                    <h3 class="truncate text-lg font-semibold">${escapeHtml(
                      entity.adminTitle || entity.title || "Untitled",
                    )}</h3>
                    ${
                      entity.type
                        ? `<span class="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs">${escapeHtml(entity.type)}</span>`
                        : ""
                    }
                  </div>
                  ${
                    entity.title && entity.title !== entity.adminTitle
                      ? `<p class="text-sm text-muted-foreground">${escapeHtml(entity.title)}</p>`
                      : ""
                  }
                </div>

                <div class="grid grid-cols-3 gap-4 text-sm">
                  ${
                    entity.slug
                      ? `<div>
                           <span class="text-slate-500">Slug</span>
                           <p class="mt-0.5 break-all font-mono text-slate-900">${escapeHtml(entity.slug)}</p>
                         </div>`
                      : ""
                  }

                  ${
                    entity.shortDescription
                      ? `<div class="col-span-2">
                           <span class="text-slate-500">Short Description</span>
                           <p class="mt-0.5 line-clamp-2 text-slate-900">${escapeHtml(entity.shortDescription)}</p>
                         </div>`
                      : ""
                  }

                  ${
                    entity.variant
                      ? `<div>
                           <span class="text-slate-500">Variant</span>
                           <p class="mt-0.5 text-slate-900">${escapeHtml(entity.variant)}</p>
                         </div>`
                      : ""
                  }
                </div>

                <div class="flex items-center gap-2">
                  <span class="text-xs text-slate-500">ID:</span>
                  <button
                    type="button"
                    data-action="copy-id"
                    data-id="${escapeHtml(entity.id)}"
                    data-copy-feedback="id"
                    data-testid="${escapeHtml(tid("entity-copy-id", state.selectedModel, entity.id))}"
                    class="rounded border border-slate-300 bg-white px-2 py-0.5 font-mono text-xs text-slate-900 transition hover:bg-slate-100"
                    aria-label="Copy id"
                  >
                    ${escapeHtml(entity.id)}
                  </button>
                </div>
              </div>

              <div class="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  data-action="edit-entity"
                  data-id="${escapeHtml(entity.id)}"
                  data-testid="${escapeHtml(tid("entity-edit", state.selectedModel, entity.id))}"
                  class="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition hover:bg-slate-100"
                >
                  <i data-lucide="pencil" class="mr-2 h-4 w-4"></i>
                  Edit
                </button>
                <button
                  type="button"
                  data-action="delete-entity"
                  data-id="${escapeHtml(entity.id)}"
                  data-testid="${escapeHtml(tid("entity-delete", state.selectedModel, entity.id))}"
                  class="inline-flex items-center rounded-md border border-slate-300 bg-white p-2 text-sm transition hover:bg-slate-100"
                  aria-label="Delete"
                >
                  <i data-lucide="trash-2" class="h-4 w-4 text-destructive"></i>
                </button>
              </div>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function renderPagination() {
    const entities = getFilteredEntities();
    const totalPages = Math.max(
      1,
      Math.ceil(entities.length / state.itemsPerPage),
    );
    dom.paginationPanel.classList.remove("hidden");

    dom.paginationPanel.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <select
            id="itemsPerPageSelect"
            data-testid="items-per-page-select"
            class="w-[140px] rounded-md border border-border bg-card px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          >
            <option value="2" ${state.itemsPerPage === 2 ? "selected" : ""}>2 per page</option>
            <option value="5" ${state.itemsPerPage === 5 ? "selected" : ""}>5 per page</option>
            <option value="10" ${state.itemsPerPage === 10 ? "selected" : ""}>10 per page</option>
            <option value="25" ${state.itemsPerPage === 25 ? "selected" : ""}>25 per page</option>
            <option value="50" ${state.itemsPerPage === 50 ? "selected" : ""}>50 per page</option>
            <option value="100" ${state.itemsPerPage === 100 ? "selected" : ""}>100 per page</option>
          </select>
          <span class="text-sm text-muted-foreground">Page ${state.currentPage} of ${totalPages} (${entities.length} total)</span>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            data-action="page-prev"
            data-testid="pagination-prev"
            class="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            ${state.currentPage <= 1 ? "disabled" : ""}
          >
            <i data-lucide="chevron-left" class="mr-1 h-4 w-4"></i>
            Prev
          </button>
          <button
            type="button"
            data-action="page-next"
            data-testid="pagination-next"
            class="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            ${state.currentPage >= totalPages ? "disabled" : ""}
          >
            Next
            <i data-lucide="chevron-right" class="ml-1 h-4 w-4"></i>
          </button>
        </div>
      </div>
    `;
  }

  function renderRelationPagination(panel, panelDepth, relationType, pageData) {
    return `
      <div
        data-testid="${escapeHtml(tid("relation-pagination", panelDepth, relationType))}"
        class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-300 pt-3"
      >
        <div class="flex items-center gap-2">
          <label class="text-sm text-muted-foreground" for="${escapeHtml(
            `relation-items-per-page-${panelDepth}-${relationType}`,
          )}">Per page</label>
          <select
            id="${escapeHtml(`relation-items-per-page-${panelDepth}-${relationType}`)}"
            data-action="relation-items-per-page"
            data-panel-depth="${panelDepth}"
            data-relation-type="${escapeHtml(relationType)}"
            data-testid="${escapeHtml(tid("relation-items-per-page", panelDepth, relationType))}"
            class="w-[130px] rounded-md border border-border bg-card px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          >
            <option value="1" ${pageData.itemsPerPage === 1 ? "selected" : ""}>1 per page</option>
            <option value="5" ${pageData.itemsPerPage === 5 ? "selected" : ""}>5 per page</option>
            <option value="10" ${pageData.itemsPerPage === 10 ? "selected" : ""}>10 per page</option>
            <option value="25" ${pageData.itemsPerPage === 25 ? "selected" : ""}>25 per page</option>
          </select>
          <span class="text-sm text-muted-foreground">Page ${pageData.currentPage} of ${pageData.totalPages} (${pageData.totalItems} total)</span>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            data-action="relation-page-prev"
            data-panel-depth="${panelDepth}"
            data-relation-type="${escapeHtml(relationType)}"
            data-testid="${escapeHtml(tid("relation-page-prev", panelDepth, relationType))}"
            class="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            ${pageData.currentPage <= 1 ? "disabled" : ""}
          >
            <i data-lucide="chevron-left" class="mr-1 h-4 w-4"></i>
            Prev
          </button>
          <button
            type="button"
            data-action="relation-page-next"
            data-panel-depth="${panelDepth}"
            data-relation-type="${escapeHtml(relationType)}"
            data-testid="${escapeHtml(tid("relation-page-next", panelDepth, relationType))}"
            class="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            ${pageData.currentPage >= pageData.totalPages ? "disabled" : ""}
          >
            Next
            <i data-lucide="chevron-right" class="ml-1 h-4 w-4"></i>
          </button>
        </div>
      </div>
    `;
  }

  function renderEntityDetailsForm(panel) {
    return `
      <div class="space-y-6">
        <section class="space-y-2">
          <label class="block text-sm font-medium" for="entity-field-adminTitle-${panel.entityId}">Admin Title</label>
          <input
            id="entity-field-adminTitle-${panel.entityId}"
            data-field="adminTitle"
            data-testid="${escapeHtml(tid("field", panel.modelName, panel.entityId, "adminTitle"))}"
            value="${escapeHtml(panel.formData.adminTitle || "")}"
            class="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </section>

        <section class="space-y-4 rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
          <h3 class="font-semibold">Title</h3>
          <div class="space-y-2">
            <label class="block text-sm font-medium" for="entity-field-title-${panel.entityId}">English</label>
            <input
              id="entity-field-title-${panel.entityId}"
              data-field="title"
              data-testid="${escapeHtml(tid("field", panel.modelName, panel.entityId, "title"))}"
              value="${escapeHtml(panel.formData.title || "")}"
              class="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium" for="entity-field-titleRu-${panel.entityId}">Russian</label>
            <input
              id="entity-field-titleRu-${panel.entityId}"
              data-field="titleRu"
              data-testid="${escapeHtml(tid("field", panel.modelName, panel.entityId, "titleRu"))}"
              value="${escapeHtml(panel.formData.titleRu || "")}"
              class="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </div>
        </section>

        <section class="space-y-4 rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
          <h3 class="font-semibold">Short Description</h3>
          <div class="space-y-2">
            <label class="block text-sm font-medium" for="entity-field-shortDescription-${panel.entityId}">English</label>
            <textarea
              id="entity-field-shortDescription-${panel.entityId}"
              data-field="shortDescription"
              data-testid="${escapeHtml(tid("field", panel.modelName, panel.entityId, "shortDescription"))}"
              rows="3"
              class="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            >${escapeHtml(panel.formData.shortDescription || "")}</textarea>
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium" for="entity-field-shortDescriptionRu-${panel.entityId}">Russian</label>
            <textarea
              id="entity-field-shortDescriptionRu-${panel.entityId}"
              data-field="shortDescriptionRu"
              data-testid="${escapeHtml(tid("field", panel.modelName, panel.entityId, "shortDescriptionRu"))}"
              rows="3"
              class="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            >${escapeHtml(panel.formData.shortDescriptionRu || "")}</textarea>
          </div>
        </section>

        <section class="space-y-2">
          <label class="block text-sm font-medium" for="entity-field-slug-${panel.entityId}">Slug</label>
          <input
            id="entity-field-slug-${panel.entityId}"
            data-field="slug"
            data-testid="${escapeHtml(tid("field", panel.modelName, panel.entityId, "slug"))}"
            value="${escapeHtml(panel.formData.slug || "")}"
            class="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </section>

        <section class="space-y-2">
          <label class="block text-sm font-medium" for="entity-field-type-${panel.entityId}">Type</label>
          <select
            id="entity-field-type-${panel.entityId}"
            data-field="type"
            data-testid="${escapeHtml(tid("field", panel.modelName, panel.entityId, "type"))}"
            class="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          >
            <option value="subscription" ${panel.formData.type === "subscription" ? "selected" : ""}>subscription</option>
            <option value="product" ${panel.formData.type === "product" ? "selected" : ""}>product</option>
            <option value="service" ${panel.formData.type === "service" ? "selected" : ""}>service</option>
          </select>
        </section>
      </div>
    `;
  }

  function getRelationTabs(panel) {
    const tabs = [
      {
        key: "products-to-attributes",
        label: "Attributes",
      },
      {
        key: "products-to-articles",
        label: "Articles",
      },
    ];

    return tabs.map((tab) => ({
      ...tab,
      count: (panel.relations[tab.key] || []).length,
    }));
  }

  function ensureActiveRelationTab(panel) {
    const tabs = getRelationTabs(panel);
    const hasActive = tabs.some((tab) => tab.key === panel.activeRelationTab);

    if (!hasActive) {
      panel.activeRelationTab = tabs[0]?.key || null;
    }
  }

  function renderRelationsView(panel, panelDepth) {
    ensureActiveRelationTab(panel);
    const tabs = getRelationTabs(panel);

    const tabsHtml = `
      <div
        data-testid="${escapeHtml(tid("relation-tabs", panelDepth, panel.modelName, panel.entityId))}"
        class="inline-flex rounded-md border border-slate-300 bg-slate-100 p-1"
      >
        ${tabs
          .map((tab) => {
            const isActive = tab.key === panel.activeRelationTab;
            return `
              <button
                type="button"
                data-action="entity-relation-tab"
                data-panel-depth="${panelDepth}"
                data-relation-tab="${escapeHtml(tab.key)}"
                data-testid="${escapeHtml(tid("relation-tab", panelDepth, panel.modelName, panel.entityId, tab.key))}"
                class="rounded px-3 py-1.5 text-sm transition ${
                  isActive ? "bg-white shadow-sm" : "text-muted-foreground"
                }"
              >
                ${escapeHtml(tab.label)}
                <span class="ml-1 rounded border border-slate-300 bg-white px-1.5 py-0.5 text-xs">${tab.count}</span>
              </button>
            `;
          })
          .join("")}
      </div>
    `;

    let contentHtml = "";
    if (panel.activeRelationTab === "products-to-attributes") {
      contentHtml = renderProductsToAttributes(panel, panelDepth);
    } else if (panel.activeRelationTab === "products-to-articles") {
      contentHtml = renderProductsToArticles(panel, panelDepth);
    }

    return `
      <div class="space-y-4">
        ${tabsHtml}
        ${contentHtml}
      </div>
    `;
  }

  function renderProductsToAttributes(panel, panelDepth) {
    const relationType = "products-to-attributes";
    const pageData = getRelationPageData(panel, relationType);
    const items = pageData.items;
    const totalItems = pageData.list.length;
    return `
      <section
        data-testid="${escapeHtml(tid("relation-section", panelDepth, "products-to-attributes"))}"
        class="rounded-xl border border-slate-300 bg-slate-100 p-5 shadow-sm"
      >
        <div class="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 class="font-semibold">Attributes linked to this product</h3>
            <p class="mt-1 text-sm text-muted-foreground">Manage product attributes and their properties</p>
          </div>
          <button
            type="button"
            data-action="relation-create"
            data-panel-depth="${panelDepth}"
            data-relation-type="products-to-attributes"
            data-testid="${escapeHtml(tid("relation-create", panelDepth, "products-to-attributes"))}"
            class="inline-flex items-center rounded-md border border-slate-400 bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:border-slate-500 hover:bg-slate-800 hover:text-white"
          >
            <i data-lucide="plus" class="mr-2 h-4 w-4"></i>
            Attach
          </button>
        </div>
        <div class="space-y-4">
          ${items
            .map((relation, index) => {
              const absoluteIndex = pageData.startIndex + index;
              return `
                <article
                  data-testid="${escapeHtml(tid("relation-card", panelDepth, "products-to-attributes", relation.id))}"
                  class="rounded-lg border border-slate-300 bg-white p-4 shadow-sm"
                >
                  <div class="flex items-start gap-3">
                    <div class="flex flex-col items-center gap-1 pt-1">
                      <button
                        type="button"
                        data-action="relation-move-up"
                        data-panel-depth="${panelDepth}"
                        data-relation-type="products-to-attributes"
                        data-relation-id="${escapeHtml(relation.id)}"
                        data-testid="${escapeHtml(
                          tid(
                            "relation-move-up",
                            panelDepth,
                            "products-to-attributes",
                            relation.id,
                          ),
                        )}"
                        class="rounded p-1 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                        ${absoluteIndex === 0 ? "disabled" : ""}
                        aria-label="Move up"
                      >
                        <i data-lucide="chevron-up" class="h-3 w-3"></i>
                      </button>
                      <button
                        type="button"
                        data-action="relation-move-down"
                        data-panel-depth="${panelDepth}"
                        data-relation-type="products-to-attributes"
                        data-relation-id="${escapeHtml(relation.id)}"
                        data-testid="${escapeHtml(
                          tid(
                            "relation-move-down",
                            panelDepth,
                            "products-to-attributes",
                            relation.id,
                          ),
                        )}"
                        class="rounded p-1 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                        ${absoluteIndex === totalItems - 1 ? "disabled" : ""}
                        aria-label="Move down"
                      >
                        <i data-lucide="chevron-down" class="h-3 w-3"></i>
                      </button>
                    </div>

                    <div class="min-w-0 flex-1 space-y-3">
                      <div class="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <span class="text-slate-500">Order Index</span>
                          <p class="mt-0.5 font-mono text-slate-900">${escapeHtml(relation.orderIndex)}</p>
                        </div>
                        <div>
                          <span class="text-slate-500">Variant</span>
                          <p class="mt-0.5 text-slate-900">${escapeHtml(relation.variant)}</p>
                        </div>
                        <div>
                          <span class="text-slate-500">Class Name</span>
                          <p class="mt-0.5 text-slate-900">${escapeHtml(relation.className || "—")}</p>
                        </div>
                      </div>

                      <div class="grid grid-cols-3 gap-3 text-xs">
                        <div class="min-w-0">
                          <span class="text-slate-500">Relation ID</span>
                          <div class="mt-0.5">
                            <button
                              type="button"
                              data-action="copy-id"
                              data-id="${escapeHtml(relation.id)}"
                              data-copy-feedback="id"
                              data-testid="${escapeHtml(
                                tid(
                                  "relation-copy-id",
                                  panelDepth,
                                  "products-to-attributes",
                                  relation.id,
                                ),
                              )}"
                              class="block w-full overflow-hidden text-ellipsis whitespace-nowrap rounded border border-slate-300 bg-white px-2 py-0.5 text-left font-mono text-xs text-slate-900 transition hover:bg-slate-100"
                              title="${escapeHtml(relation.id)}"
                              aria-label="Copy relation id"
                            >
                              ${escapeHtml(relation.id)}
                            </button>
                          </div>
                        </div>
                        <div class="min-w-0">
                          <span class="text-slate-500">Product ID</span>
                          <div class="mt-0.5">
                            <button
                              type="button"
                              data-action="copy-id"
                              data-id="${escapeHtml(panel.entityId)}"
                              data-copy-feedback="id"
                              data-testid="${escapeHtml(
                                tid(
                                  "relation-copy-product-id",
                                  panelDepth,
                                  "products-to-attributes",
                                  panel.entityId,
                                ),
                              )}"
                              class="block w-full overflow-hidden text-ellipsis whitespace-nowrap rounded border border-slate-300 bg-white px-2 py-0.5 text-left font-mono text-xs text-slate-900 transition hover:bg-slate-100"
                              title="${escapeHtml(panel.entityId)}"
                              aria-label="Copy product id"
                            >
                              ${escapeHtml(panel.entityId)}
                            </button>
                          </div>
                        </div>
                        <div class="min-w-0">
                          <span class="text-slate-500">Attribute ID</span>
                          <div class="mt-0.5">
                            <button
                              type="button"
                              data-action="copy-id"
                              data-id="${escapeHtml(relation.attribute.id)}"
                              data-copy-feedback="id"
                              data-testid="${escapeHtml(
                                tid(
                                  "relation-copy-attribute-id",
                                  panelDepth,
                                  "products-to-attributes",
                                  relation.attribute.id,
                                ),
                              )}"
                              class="block w-full overflow-hidden text-ellipsis whitespace-nowrap rounded border border-slate-300 bg-white px-2 py-0.5 text-left font-mono text-xs text-slate-900 transition hover:bg-slate-100"
                              title="${escapeHtml(relation.attribute.id)}"
                              aria-label="Copy attribute id"
                            >
                              ${escapeHtml(relation.attribute.id)}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="flex shrink-0 flex-col gap-2">
                      <button
                        type="button"
                        data-action="relation-edit"
                        data-panel-depth="${panelDepth}"
                        data-relation-type="products-to-attributes"
                        data-relation-id="${escapeHtml(relation.id)}"
                        data-testid="${escapeHtml(
                          tid(
                            "relation-edit",
                            panelDepth,
                            "products-to-attributes",
                            relation.id,
                          ),
                        )}"
                        class="inline-flex items-center rounded-md border border-border p-2 transition hover:bg-white"
                        aria-label="Edit relation"
                      >
                        <i data-lucide="pencil" class="h-3 w-3"></i>
                      </button>
                      <button
                        type="button"
                        data-action="open-related-entity"
                        data-panel-depth="${panelDepth}"
                        data-related-model="attribute"
                        data-related-id="${escapeHtml(relation.attribute.id)}"
                        data-testid="${escapeHtml(
                          tid(
                            "open-related-entity",
                            panelDepth,
                            "attribute",
                            relation.attribute.id,
                          ),
                        )}"
                        class="inline-flex items-center rounded-md border border-border p-2 transition hover:bg-white"
                        aria-label="Open related entity"
                      >
                        <i data-lucide="external-link" class="h-3 w-3"></i>
                      </button>
                      <button
                        type="button"
                        data-action="relation-delete"
                        data-panel-depth="${panelDepth}"
                        data-relation-type="products-to-attributes"
                        data-relation-id="${escapeHtml(relation.id)}"
                        data-testid="${escapeHtml(
                          tid(
                            "relation-delete",
                            panelDepth,
                            "products-to-attributes",
                            relation.id,
                          ),
                        )}"
                        class="inline-flex items-center rounded-md border border-border p-2 transition hover:bg-white"
                        aria-label="Delete relation"
                      >
                        <i data-lucide="trash-2" class="h-3 w-3 text-destructive"></i>
                      </button>
                    </div>
                  </div>
                </article>
              `;
            })
            .join("")}
        </div>
        ${renderRelationPagination(panel, panelDepth, relationType, pageData)}
      </section>
    `;
  }

  function renderProductsToArticles(panel, panelDepth) {
    const relationType = "products-to-articles";
    const pageData = getRelationPageData(panel, relationType);
    const items = pageData.items;
    const totalItems = pageData.list.length;
    return `
      <section
        data-testid="${escapeHtml(tid("relation-section", panelDepth, "products-to-articles"))}"
        class="rounded-xl border border-slate-300 bg-slate-100 p-5 shadow-sm"
      >
        <div class="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 class="font-semibold">Articles linked to this product</h3>
            <p class="mt-1 text-sm text-muted-foreground">Related blog posts and documentation</p>
          </div>
          <button
            type="button"
            data-action="relation-create"
            data-panel-depth="${panelDepth}"
            data-relation-type="products-to-articles"
            data-testid="${escapeHtml(tid("relation-create", panelDepth, "products-to-articles"))}"
            class="inline-flex items-center rounded-md border border-slate-400 bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:border-slate-500 hover:bg-slate-800 hover:text-white"
          >
            <i data-lucide="plus" class="mr-2 h-4 w-4"></i>
            Attach
          </button>
        </div>
        <div class="space-y-4">
          ${items
            .map((relation, index) => {
              const absoluteIndex = pageData.startIndex + index;
              return `
                <article
                  data-testid="${escapeHtml(tid("relation-card", panelDepth, "products-to-articles", relation.id))}"
                  class="rounded-lg border border-slate-300 bg-white p-4 shadow-sm"
                >
                  <div class="flex items-start gap-3">
                    <div class="flex flex-col items-center gap-1 pt-1">
                      <button
                        type="button"
                        data-action="relation-move-up"
                        data-panel-depth="${panelDepth}"
                        data-relation-type="products-to-articles"
                        data-relation-id="${escapeHtml(relation.id)}"
                        data-testid="${escapeHtml(
                          tid(
                            "relation-move-up",
                            panelDepth,
                            "products-to-articles",
                            relation.id,
                          ),
                        )}"
                        class="rounded p-1 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                        ${absoluteIndex === 0 ? "disabled" : ""}
                        aria-label="Move up"
                      >
                        <i data-lucide="chevron-up" class="h-3 w-3"></i>
                      </button>
                      <button
                        type="button"
                        data-action="relation-move-down"
                        data-panel-depth="${panelDepth}"
                        data-relation-type="products-to-articles"
                        data-relation-id="${escapeHtml(relation.id)}"
                        data-testid="${escapeHtml(
                          tid(
                            "relation-move-down",
                            panelDepth,
                            "products-to-articles",
                            relation.id,
                          ),
                        )}"
                        class="rounded p-1 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                        ${absoluteIndex === totalItems - 1 ? "disabled" : ""}
                        aria-label="Move down"
                      >
                        <i data-lucide="chevron-down" class="h-3 w-3"></i>
                      </button>
                    </div>

                    <div class="min-w-0 flex-1 space-y-3">
                      <div>
                        <div class="text-sm">
                          <span class="text-slate-500">Slug</span>
                          <p class="mt-0.5 text-slate-900">${escapeHtml(relation.article.slug)}</p>
                        </div>
                      </div>

                      <div class="text-sm">
                        <span class="text-slate-500">Order Index</span>
                        <p class="mt-0.5 font-mono text-slate-900">${escapeHtml(relation.orderIndex)}</p>
                      </div>

                      <div class="grid grid-cols-2 gap-3 text-xs">
                        <div class="min-w-0">
                          <span class="text-slate-500">Relation ID</span>
                          <div class="mt-0.5">
                            <button
                              type="button"
                              data-action="copy-id"
                              data-id="${escapeHtml(relation.id)}"
                              data-copy-feedback="id"
                              data-testid="${escapeHtml(
                                tid(
                                  "relation-copy-id",
                                  panelDepth,
                                  "products-to-articles",
                                  relation.id,
                                ),
                              )}"
                              class="block w-full overflow-hidden text-ellipsis whitespace-nowrap rounded border border-slate-300 bg-white px-2 py-0.5 text-left font-mono text-xs text-slate-900 transition hover:bg-slate-100"
                              title="${escapeHtml(relation.id)}"
                              aria-label="Copy relation id"
                            >
                              ${escapeHtml(relation.id)}
                            </button>
                          </div>
                        </div>
                        <div class="min-w-0">
                          <span class="text-slate-500">Article ID</span>
                          <div class="mt-0.5">
                            <button
                              type="button"
                              data-action="copy-id"
                              data-id="${escapeHtml(relation.article.id)}"
                              data-copy-feedback="id"
                              data-testid="${escapeHtml(
                                tid(
                                  "relation-copy-article-id",
                                  panelDepth,
                                  "products-to-articles",
                                  relation.article.id,
                                ),
                              )}"
                              class="block w-full overflow-hidden text-ellipsis whitespace-nowrap rounded border border-slate-300 bg-white px-2 py-0.5 text-left font-mono text-xs text-slate-900 transition hover:bg-slate-100"
                              title="${escapeHtml(relation.article.id)}"
                              aria-label="Copy article id"
                            >
                              ${escapeHtml(relation.article.id)}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="flex shrink-0 flex-col gap-2">
                      <button
                        type="button"
                        data-action="relation-edit"
                        data-panel-depth="${panelDepth}"
                        data-relation-type="products-to-articles"
                        data-relation-id="${escapeHtml(relation.id)}"
                        data-testid="${escapeHtml(
                          tid(
                            "relation-edit",
                            panelDepth,
                            "products-to-articles",
                            relation.id,
                          ),
                        )}"
                        class="inline-flex items-center rounded-md border border-border p-2 transition hover:bg-white"
                        aria-label="Edit relation"
                      >
                        <i data-lucide="pencil" class="h-3 w-3"></i>
                      </button>
                      <button
                        type="button"
                        data-action="open-related-entity"
                        data-panel-depth="${panelDepth}"
                        data-related-model="article"
                        data-related-id="${escapeHtml(relation.article.id)}"
                        data-testid="${escapeHtml(
                          tid(
                            "open-related-entity",
                            panelDepth,
                            "article",
                            relation.article.id,
                          ),
                        )}"
                        class="inline-flex items-center rounded-md border border-border p-2 transition hover:bg-white"
                        aria-label="Open related entity"
                      >
                        <i data-lucide="external-link" class="h-3 w-3"></i>
                      </button>
                      <button
                        type="button"
                        data-action="relation-delete"
                        data-panel-depth="${panelDepth}"
                        data-relation-type="products-to-articles"
                        data-relation-id="${escapeHtml(relation.id)}"
                        data-testid="${escapeHtml(
                          tid(
                            "relation-delete",
                            panelDepth,
                            "products-to-articles",
                            relation.id,
                          ),
                        )}"
                        class="inline-flex items-center rounded-md border border-border p-2 transition hover:bg-white"
                        aria-label="Delete relation"
                      >
                        <i data-lucide="trash-2" class="h-3 w-3 text-destructive"></i>
                      </button>
                    </div>
                  </div>
                </article>
              `;
            })
            .join("")}
        </div>
        ${renderRelationPagination(panel, panelDepth, relationType, pageData)}
      </section>
    `;
  }

  function renderEntityPanel(panel, panelDepth, topDepth) {
    const isTop = panelDepth === topDepth;
    const relationCount = Object.values(panel.relations).reduce(
      (sum, list) => sum + list.length,
      0,
    );

    const stackedOffset = (topDepth - panelDepth) * 40;
    const relationOffset = isTop && state.relationEditor.open ? 40 : 0;
    const scale = Math.max(
      0.84,
      1 -
        (topDepth - panelDepth) * 0.03 -
        (isTop && state.relationEditor.open ? 0.03 : 0),
    );
    const translate = stackedOffset + relationOffset;

    return `
      <aside
        data-panel-depth="${panelDepth}"
        data-testid="${escapeHtml(tid("entity-panel", panelDepth, panel.modelName, panel.entityId))}"
        class="absolute right-0 top-0 flex h-screen w-full max-w-3xl flex-col overflow-hidden border-l border-border bg-slate-50 shadow-panel transition-transform duration-300 ${
          isTop ? "pointer-events-auto" : "pointer-events-none"
        }"
        style="transform: translateX(-${translate}px) scale(${scale}); z-index: ${100 + panelDepth};"
      >
        <header class="border-b border-border bg-white px-6 pb-4 pt-6">
          <div class="flex items-start gap-4">
            <div class="min-w-0 flex-1">
              <h2 class="text-3xl font-bold tracking-tight">Update ${escapeHtml(formatLabel(panel.modelName))}</h2>
              <div class="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  data-action="copy-id"
                  data-id="${escapeHtml(panel.entityId)}"
                  data-copy-feedback="id"
                  data-testid="${escapeHtml(tid("panel-copy-id", panelDepth, panel.modelName, panel.entityId))}"
                  class="rounded border border-slate-300 bg-muted px-2 py-1 font-mono text-xs text-muted-foreground transition hover:bg-slate-100"
                  aria-label="Copy id"
                >
                  ${escapeHtml(panel.entityId)}
                </button>
              </div>
            </div>
            <button
              type="button"
              data-action="close-entity-drawer"
              data-panel-depth="${panelDepth}"
              data-testid="${escapeHtml(tid("panel-close", panelDepth, panel.modelName, panel.entityId))}"
              class="rounded p-2 transition hover:bg-muted"
              aria-label="Close editor"
            >
              <i data-lucide="x" class="h-4 w-4"></i>
            </button>
          </div>
        </header>

        <div class="border-b border-border bg-white px-6 py-4">
          <div class="inline-flex rounded-md border border-slate-300 bg-slate-100 p-1">
            <button
              type="button"
              data-action="entity-tab"
              data-panel-depth="${panelDepth}"
              data-tab="details"
              data-testid="${escapeHtml(tid("panel-tab-details", panelDepth, panel.modelName, panel.entityId))}"
              class="rounded px-3 py-1.5 text-sm transition ${
                panel.activeTab === "details"
                  ? "bg-white shadow-sm"
                  : "text-muted-foreground"
              }"
            >
              Details
            </button>
            <button
              type="button"
              data-action="entity-tab"
              data-panel-depth="${panelDepth}"
              data-tab="relations"
              data-testid="${escapeHtml(tid("panel-tab-relations", panelDepth, panel.modelName, panel.entityId))}"
              class="rounded px-3 py-1.5 text-sm transition ${
                panel.activeTab === "relations"
                  ? "bg-white shadow-sm"
                  : "text-muted-foreground"
              }"
            >
              Relations
              <span class="ml-1 rounded border border-slate-300 bg-white px-1.5 py-0.5 text-xs">${relationCount}</span>
            </button>
          </div>
        </div>

        <div
          class="scroll-thin flex-1 overflow-y-auto bg-slate-50 px-6 py-6"
          data-panel-depth="${panelDepth}"
          data-testid="${escapeHtml(tid("panel-content", panelDepth, panel.modelName, panel.entityId))}"
        >
          ${
            panel.activeTab === "details"
              ? renderEntityDetailsForm(panel)
              : renderRelationsView(panel, panelDepth)
          }
        </div>

        <footer class="flex items-center justify-end gap-3 border-t border-border bg-white p-6">
          <button
            type="button"
            data-action="close-entity-drawer"
            data-panel-depth="${panelDepth}"
            data-testid="${escapeHtml(tid("panel-cancel", panelDepth, panel.modelName, panel.entityId))}"
            class="rounded-md border border-border px-4 py-2 text-sm transition hover:bg-muted"
          >
            Cancel
          </button>
          ${
            panel.activeTab === "details"
              ? `
          <button
            type="button"
            data-action="save-entity"
            data-panel-depth="${panelDepth}"
            data-testid="${escapeHtml(tid("panel-save", panelDepth, panel.modelName, panel.entityId))}"
            class="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground transition hover:bg-slate-700"
          >
            <i data-lucide="save" class="mr-2 h-4 w-4"></i>
            Save Changes
          </button>
          `
              : ""
          }
        </footer>
      </aside>
    `;
  }

  function renderEntityDrawers() {
    const hasPanels = state.drawerStack.length > 0;
    setBackdropVisible(dom.entityDrawerBackdrop, hasPanels);

    if (!hasPanels) {
      dom.entityDrawer.innerHTML = "";
      return;
    }

    const topDepth = getTopPanelDepth();
    dom.entityDrawer.innerHTML = state.drawerStack
      .map((panel, panelDepth) =>
        renderEntityPanel(panel, panelDepth, topDepth),
      )
      .join("");
  }

  function renderRelationDrawer() {
    const rel = state.relationEditor;
    setDrawerVisibility(dom.relationDrawer, rel.open);
    setBackdropVisible(dom.relationDrawerBackdrop, rel.open);

    if (!rel.open || !rel.formData) {
      dom.relationDrawer.innerHTML = "";
      return;
    }

    const panel = getPanelByDepth(rel.ownerDepth);
    if (!panel) {
      closeRelationDrawer();
      return;
    }

    const available = getAvailableRelationEntities(rel.relationType);
    const entityType =
      rel.relationType === "products-to-attributes" ? "attribute" : "article";

    dom.relationDrawer.innerHTML = `
      <header class="border-b border-border px-6 pb-4 pt-6">
        <div class="flex items-start gap-4">
          <div class="min-w-0 flex-1">
            <h2 class="text-3xl font-bold tracking-tight">${rel.mode === "create" ? "Create" : "Edit"} Relation</h2>
            <p class="mt-1 text-sm text-muted-foreground">
              ${
                rel.mode === "create"
                  ? `Link a new ${entityType} to this entity`
                  : "Update the relation properties"
              }
            </p>
          </div>
          <button
            type="button"
            data-action="close-relation-drawer"
            data-testid="${escapeHtml(tid("relation-drawer-close", rel.ownerDepth, rel.relationType))}"
            class="rounded p-2 transition hover:bg-muted"
            aria-label="Close relation editor"
          >
            <i data-lucide="x" class="h-4 w-4"></i>
          </button>
        </div>
      </header>

      <div class="scroll-thin flex-1 space-y-4 overflow-y-auto px-6 py-6">
        ${
          rel.mode === "create"
            ? `
          <section class="space-y-2">
            <label class="block text-sm font-medium">${formatLabel(entityType)}</label>
            <select
              data-relation-field="selectedEntityId"
              data-testid="${escapeHtml(tid("relation-field", rel.ownerDepth, rel.relationType, "selectedEntityId"))}"
              class="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            >
              <option value="">Select ${entityType}...</option>
              ${available
                .map((item) => {
                  return `
                    <option value="${escapeHtml(item.id)}" ${
                      rel.formData.selectedEntityId === item.id
                        ? "selected"
                        : ""
                    }>
                      ${escapeHtml(getRelationEntityLabel(rel.relationType, item))}
                    </option>
                  `;
                })
                .join("")}
            </select>
          </section>
        `
            : ""
        }

        <section class="space-y-2">
          <label class="block text-sm font-medium">Order Index</label>
          <input
            data-relation-field="orderIndex"
            data-testid="${escapeHtml(tid("relation-field", rel.ownerDepth, rel.relationType, "orderIndex"))}"
            type="number"
            value="${escapeHtml(rel.formData.orderIndex ?? 0)}"
            class="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </section>

        ${
          rel.relationType === "products-to-attributes"
            ? `
          <section class="space-y-2">
            <label class="block text-sm font-medium">Variant</label>
            <select
              data-relation-field="variant"
              data-testid="${escapeHtml(tid("relation-field", rel.ownerDepth, rel.relationType, "variant"))}"
              class="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            >
              <option value="default" ${rel.formData.variant === "default" ? "selected" : ""}>default</option>
              <option value="alternative" ${rel.formData.variant === "alternative" ? "selected" : ""}>alternative</option>
              <option value="premium" ${rel.formData.variant === "premium" ? "selected" : ""}>premium</option>
            </select>
          </section>

          <section class="space-y-2">
            <label class="block text-sm font-medium">Class Name</label>
            <input
              data-relation-field="className"
              data-testid="${escapeHtml(tid("relation-field", rel.ownerDepth, rel.relationType, "className"))}"
              value="${escapeHtml(rel.formData.className || "")}"
              placeholder="Optional CSS class"
              class="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </section>
        `
            : ""
        }
      </div>

      <footer class="flex items-center justify-end gap-3 border-t border-border p-6">
        <button
          type="button"
          data-action="close-relation-drawer"
          data-testid="${escapeHtml(tid("relation-drawer-cancel", rel.ownerDepth, rel.relationType))}"
          class="rounded-md border border-border px-4 py-2 text-sm transition hover:bg-muted"
        >
          Cancel
        </button>
        <button
          type="button"
          data-action="save-relation"
          data-testid="${escapeHtml(tid("relation-drawer-save", rel.ownerDepth, rel.relationType))}"
          class="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          ${rel.mode === "create" && !rel.formData.selectedEntityId ? "disabled" : ""}
        >
          <i data-lucide="save" class="mr-2 h-4 w-4"></i>
          ${rel.mode === "create" ? "Create Relation" : "Update Relation"}
        </button>
      </footer>
    `;
  }

  function renderConfirmDialog() {
    const dialog = state.confirmDialog;
    setBackdropVisible(dom.confirmDialogBackdrop, dialog.open);

    if (!dialog.open) {
      dom.confirmDialog.classList.add("pointer-events-none", "opacity-0");
      dom.confirmDialog.classList.remove("opacity-100");
      dom.confirmDialog.innerHTML = "";
      return;
    }

    dom.confirmDialog.classList.remove("pointer-events-none", "opacity-0");
    dom.confirmDialog.classList.add("opacity-100");
    dom.confirmDialog.innerHTML = `
      <div
        data-testid="confirm-dialog-panel"
        class="w-full max-w-md rounded-xl border border-slate-300 bg-white p-6 shadow-panel"
      >
        <div class="space-y-2">
          <h3 class="text-xl font-semibold">${escapeHtml(dialog.title)}</h3>
          <p class="text-sm text-muted-foreground">${escapeHtml(dialog.description)}</p>
        </div>

        <div class="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            data-action="close-confirm-dialog"
            data-testid="confirm-dialog-cancel"
            class="rounded-md border border-border px-4 py-2 text-sm transition hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            data-action="confirm-delete"
            data-testid="confirm-dialog-delete"
            class="inline-flex items-center rounded-md border border-red-300 bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            ${escapeHtml(dialog.confirmLabel)}
          </button>
        </div>
      </div>
    `;
  }

  function runIcons() {
    if (window.lucide?.createIcons) {
      window.lucide.createIcons();
    }
  }

  function render() {
    ensureModelInModule();
    renderSidebar();
    renderModules();
    renderHeader();
    renderEntityList();
    renderPagination();
    renderEntityDrawers();
    renderRelationDrawer();
    renderConfirmDialog();
    runIcons();
  }

  function bindEvents() {
    dom.toggleSidebarButton.addEventListener("click", function () {
      state.sidebarOpen = !state.sidebarOpen;
      render();
    });

    dom.modelSearchInput.addEventListener("input", function (event) {
      state.modelSearch = event.target.value;
      render();
    });

    dom.entitySearchInput.addEventListener("input", function (event) {
      state.entitySearch = event.target.value;
      state.currentPage = 1;
      render();
    });

    dom.sortSelect.addEventListener("change", function (event) {
      state.sortBy = event.target.value;
      render();
    });

    dom.addNewButton.addEventListener("click", function () {
      alert("Add new action is a prototype hook.");
    });

    dom.entityDrawerBackdrop.addEventListener("click", function () {
      closeTopEntityPanel();
    });

    dom.relationDrawerBackdrop.addEventListener("click", function () {
      closeRelationDrawer();
    });

    dom.confirmDialogBackdrop.addEventListener("click", function () {
      closeConfirmDialog();
    });

    document.addEventListener("mousedown", function (event) {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (state.confirmDialog.open) {
        return;
      }

      if (state.relationEditor.open) {
        if (!dom.relationDrawer.contains(target)) {
          closeRelationDrawer();
        }
        return;
      }

      if (!state.drawerStack.length) {
        return;
      }

      const topDepth = getTopPanelDepth();
      const topPanel = dom.entityDrawer.querySelector(
        `[data-panel-depth="${topDepth}"]`,
      );
      if (topPanel && !topPanel.contains(target)) {
        closeTopEntityPanel();
      }
    });

    document.addEventListener("change", function (event) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      if (target.id === "itemsPerPageSelect") {
        state.itemsPerPage = Number(target.value || 100);
        state.currentPage = 1;
        render();
        return;
      }

      if (target.matches('[data-action="relation-items-per-page"]')) {
        const panelDepth = Number(target.getAttribute("data-panel-depth"));
        const relationType = target.getAttribute("data-relation-type");
        const panel = getPanelByDepth(panelDepth);
        if (panel && relationType) {
          const paging = ensureRelationPaging(panel, relationType);
          paging.itemsPerPage = Math.max(1, Number(target.value || 1));
          paging.currentPage = 1;
          render();
        }
        return;
      }

      if (target.matches("[data-field]")) {
        const panelDepth = Number(
          target
            .closest("[data-panel-depth]")
            ?.getAttribute("data-panel-depth"),
        );
        const panel = Number.isFinite(panelDepth)
          ? getPanelByDepth(panelDepth)
          : getTopPanel();
        const field = target.getAttribute("data-field");
        if (panel && field) {
          panel.formData[field] = target.value;
        }
      }

      if (
        target.matches("[data-relation-field]") &&
        state.relationEditor.formData
      ) {
        const field = target.getAttribute("data-relation-field");
        if (field) {
          state.relationEditor.formData[field] = target.value;
        }
      }
    });

    document.addEventListener("input", function (event) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      if (target.matches("[data-field]")) {
        const panelDepth = Number(
          target
            .closest("[data-panel-depth]")
            ?.getAttribute("data-panel-depth"),
        );
        const panel = Number.isFinite(panelDepth)
          ? getPanelByDepth(panelDepth)
          : getTopPanel();
        const field = target.getAttribute("data-field");
        if (panel && field) {
          panel.formData[field] = target.value;
        }
      }

      if (
        target.matches("[data-relation-field]") &&
        state.relationEditor.formData
      ) {
        const field = target.getAttribute("data-relation-field");
        if (field) {
          state.relationEditor.formData[field] = target.value;
        }
      }
    });

    document.addEventListener("click", function (event) {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const actionElement = target.closest("[data-action]");
      if (!actionElement) {
        return;
      }

      const action = actionElement.getAttribute("data-action");
      if (!action) {
        return;
      }

      if (action === "select-module") {
        state.selectedModule = actionElement.getAttribute("data-module");
        state.modelSearch = "";
        state.currentPage = 1;
        ensureModelInModule();
        render();
        return;
      }

      if (action === "select-model") {
        state.selectedModel = actionElement.getAttribute("data-model");
        state.currentPage = 1;
        state.entitySearch = "";
        dom.entitySearchInput.value = "";
        render();
        return;
      }

      if (action === "copy-id") {
        copyToClipboard(actionElement.getAttribute("data-id"), actionElement);
        return;
      }

      if (action === "edit-entity") {
        openEntityEditorById(actionElement.getAttribute("data-id"), {
          append: false,
          modelName: state.selectedModel,
          moduleId: state.selectedModule,
        });
        return;
      }

      if (action === "delete-entity") {
        openConfirmDialog({
          actionType: "entity-delete",
          title: "Delete entity?",
          description:
            "This action cannot be undone. The entity will be permanently removed.",
          confirmLabel: "Delete entity",
          payload: {
            modelName: state.selectedModel,
            id: actionElement.getAttribute("data-id"),
          },
        });
        return;
      }

      if (action === "page-prev") {
        state.currentPage = Math.max(1, state.currentPage - 1);
        render();
        return;
      }

      if (action === "page-next") {
        const totalPages = Math.max(
          1,
          Math.ceil(getFilteredEntities().length / state.itemsPerPage),
        );
        state.currentPage = Math.min(totalPages, state.currentPage + 1);
        render();
        return;
      }

      if (action === "close-entity-drawer") {
        closeTopEntityPanel();
        return;
      }

      if (action === "save-entity") {
        saveEntity();
        return;
      }

      if (action === "entity-tab") {
        const panelDepth = Number(
          actionElement.getAttribute("data-panel-depth"),
        );
        const panel = getPanelByDepth(panelDepth);
        if (panel) {
          panel.activeTab = actionElement.getAttribute("data-tab") || "details";
          render();
        }
        return;
      }

      if (action === "entity-relation-tab") {
        const panelDepth = Number(
          actionElement.getAttribute("data-panel-depth"),
        );
        const panel = getPanelByDepth(panelDepth);
        if (panel) {
          panel.activeRelationTab =
            actionElement.getAttribute("data-relation-tab") ||
            "products-to-attributes";
          render();
        }
        return;
      }

      if (action === "relation-create") {
        openRelationDrawer({
          mode: "create",
          panelDepth: Number(actionElement.getAttribute("data-panel-depth")),
          relationType: actionElement.getAttribute("data-relation-type"),
        });
        return;
      }

      if (action === "relation-edit") {
        openRelationDrawer({
          mode: "edit",
          panelDepth: Number(actionElement.getAttribute("data-panel-depth")),
          relationType: actionElement.getAttribute("data-relation-type"),
          relationId: actionElement.getAttribute("data-relation-id"),
        });
        return;
      }

      if (action === "relation-delete") {
        openConfirmDialog({
          actionType: "relation-delete",
          title: "Delete relation?",
          description: "This relation link will be removed from the entity.",
          confirmLabel: "Delete relation",
          payload: {
            panelDepth: Number(actionElement.getAttribute("data-panel-depth")),
            relationType: actionElement.getAttribute("data-relation-type"),
            relationId: actionElement.getAttribute("data-relation-id"),
          },
        });
        return;
      }

      if (action === "relation-move-up") {
        moveRelation(
          Number(actionElement.getAttribute("data-panel-depth")),
          actionElement.getAttribute("data-relation-type"),
          actionElement.getAttribute("data-relation-id"),
          "up",
        );
        return;
      }

      if (action === "relation-move-down") {
        moveRelation(
          Number(actionElement.getAttribute("data-panel-depth")),
          actionElement.getAttribute("data-relation-type"),
          actionElement.getAttribute("data-relation-id"),
          "down",
        );
        return;
      }

      if (action === "relation-page-prev") {
        const panelDepth = Number(
          actionElement.getAttribute("data-panel-depth"),
        );
        const relationType = actionElement.getAttribute("data-relation-type");
        const panel = getPanelByDepth(panelDepth);
        if (panel && relationType) {
          const paging = ensureRelationPaging(panel, relationType);
          paging.currentPage = Math.max(1, paging.currentPage - 1);
          render();
        }
        return;
      }

      if (action === "relation-page-next") {
        const panelDepth = Number(
          actionElement.getAttribute("data-panel-depth"),
        );
        const relationType = actionElement.getAttribute("data-relation-type");
        const panel = getPanelByDepth(panelDepth);
        if (panel && relationType) {
          const paging = ensureRelationPaging(panel, relationType);
          const totalPages = Math.max(
            1,
            Math.ceil(
              getRelationListByType(panel, relationType).length /
                paging.itemsPerPage,
            ),
          );
          paging.currentPage = Math.min(totalPages, paging.currentPage + 1);
          render();
        }
        return;
      }

      if (action === "open-related-entity") {
        openRelatedEntity({
          id: actionElement.getAttribute("data-related-id"),
          model: actionElement.getAttribute("data-related-model"),
        });
        return;
      }

      if (action === "close-relation-drawer") {
        closeRelationDrawer();
        return;
      }

      if (action === "close-confirm-dialog") {
        closeConfirmDialog();
        return;
      }

      if (action === "confirm-delete") {
        confirmDelete();
        return;
      }

      if (action === "save-relation") {
        saveRelation();
      }
    });
  }

  bindEvents();
  render();
})();
