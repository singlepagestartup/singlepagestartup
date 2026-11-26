import { Component as FrameworkServiceList } from "./framework-service-list";
import { Component as FrameworkServiceDetail } from "./framework-service-detail";
import { Component as SubjectMeCustomerOrder } from "./subject-me-customer-order";
import { Component as SubjectMeCustomerOrders } from "./subject-me-customer-orders";
import { Component as SubjectMeBlogModuleArticleCreate } from "./subject-me-blog-module-article-create";
import { Component as SubjectMeEcommerceModuleProductListDefault } from "./subject-me-ecommerce-module-product-list-default";
import { Component as SubjectMeEcommerceModuleTokenFind } from "./subject-me-ecommerce-module-token-find";
import { Component as AdminV2Card } from "./admin-v2-card/index";
import { Component as AdminV2Table } from "./admin-v2-table/index";
import { Component as List } from "./list/index";
import { Component as SubjectMeAuthenticationRegistrationAiChat } from "./subject-me-authentication-registration-ai-chat/index";
import { Component as SubjectMeAuthenticationSelectMethodAiChat } from "./subject-me-authentication-select-method-ai-chat/index";
import { Component as SubjectMeCrmModuleFormSupportAiChat } from "./subject-me-crm-module-form-support-ai-chat/index";
import { Component as SubjectMeProfileSettings } from "./subject-me-profile-settings/index";
import { Component as SubjectMeSocialModuleProfileChatListDefault } from "./subject/me/social-module/profile/chat/list-default/index";
import { Component as SubjectMeSocialModuleProfileChatOverviewDefault } from "./subject/me/social-module/profile/chat/overview-default/index";
import { Component as SubjectMeStoreCustomerWork } from "./subject-me-store-customer-work";
import { Component as SubjectMeStoreProviderSettings } from "./subject-me-store-provider-settings";

export const variants = {
  "framework-service-list": FrameworkServiceList,
  "framework-service-detail": FrameworkServiceDetail,
  "subject-me-customer-order": SubjectMeCustomerOrder,
  "subject-me-customer-orders": SubjectMeCustomerOrders,
  "subject-me-store-provider-settings": SubjectMeStoreProviderSettings,
  "subject-me-store-customer-work": SubjectMeStoreCustomerWork,
  "subject-me-blog-module-article-create": SubjectMeBlogModuleArticleCreate,
  "subject-me-ecommerce-module-product-list-default":
    SubjectMeEcommerceModuleProductListDefault,
  "subject-me-ecommerce-module-token-find": SubjectMeEcommerceModuleTokenFind,
  "admin-v2-card": AdminV2Card,
  "admin-v2-table": AdminV2Table,
  list: List,
  "subject-me-authentication-registration-ai-chat":
    SubjectMeAuthenticationRegistrationAiChat,
  "subject-me-authentication-select-method-ai-chat":
    SubjectMeAuthenticationSelectMethodAiChat,
  "subject-me-crm-module-form-support-ai-chat":
    SubjectMeCrmModuleFormSupportAiChat,
  "subject-me-profile-settings": SubjectMeProfileSettings,
  "subject-me-social-module-profile-chat-list-default":
    SubjectMeSocialModuleProfileChatListDefault,
  "subject-me-social-module-profile-chat-overview-default":
    SubjectMeSocialModuleProfileChatOverviewDefault,
};
