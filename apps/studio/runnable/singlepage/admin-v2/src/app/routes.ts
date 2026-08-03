import { createBrowserRouter } from "react-router";
import { AdminLayout } from "./layouts/AdminLayout";
import { SiteLayout } from "./layouts/SiteLayout";
import { ModuleDashboard } from "./components/ModuleDashboard";
import { ModelList } from "./components/ModelList";
import { ModelEdit } from "./components/ModelEdit";
import { Root } from "./components/Root";
import { SettingsPage } from "./components/SettingsPage";
import { AccountSettingsPage } from "./components/AccountSettingsPage";
import { SiteLanding } from "./components/SiteLanding";
import { BlogListPage } from "./components/BlogListPage";
import { BlogArticlePage } from "./components/BlogArticlePage";
import { CatalogPage } from "./components/CatalogPage";
import { ProductPage } from "./components/ProductPage";
import { CheckoutPage } from "./components/CheckoutPage";
import { AuthorPage } from "./components/AuthorPage";
import { LoginPage } from "./components/LoginPage";
import { ForgotPasswordPage } from "./components/ForgotPasswordPage";
import { RegisterPage } from "./components/RegisterPage";
import { TermsPage } from "./components/TermsPage";
import { PrivacyPolicyPage } from "./components/PrivacyPolicyPage";
import { UserProfilePage } from "./components/UserProfilePage";
import { ChatPage } from "./components/ChatPage";
import { CatchAllRedirect } from "./components/CatchAllRedirect";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: SiteLayout,
    children: [
      {
        index: true,
        Component: SiteLanding,
      },
      {
        path: "blog",
        Component: BlogListPage,
      },
      {
        path: "blog/:slug",
        Component: BlogArticlePage,
      },
      {
        path: "blog/author/:authorSlug",
        Component: AuthorPage,
      },
      {
        path: "services",
        Component: CatalogPage,
      },
      {
        path: "services/:slug",
        Component: ProductPage,
      },
      {
        path: "checkout",
        Component: CheckoutPage,
      },
      {
        path: "login",
        Component: LoginPage,
      },
      {
        path: "forgot-password",
        Component: ForgotPasswordPage,
      },
      {
        path: "register",
        Component: RegisterPage,
      },
      {
        path: "terms",
        Component: TermsPage,
      },
      {
        path: "privacy",
        Component: PrivacyPolicyPage,
      },
      {
        path: "profile",
        Component: UserProfilePage,
      },
      {
        path: "chat",
        Component: ChatPage,
      },
    ],
  },
  {
    path: "/admin",
    Component: AdminLayout,
    children: [
      {
        index: true,
        Component: Root,
      },
      {
        path: "settings",
        Component: SettingsPage,
      },
      {
        path: "settings/account",
        Component: AccountSettingsPage,
      },
      {
        path: ":moduleSlug",
        children: [
          {
            index: true,
            Component: ModuleDashboard,
          },
          {
            path: ":modelSlug",
            Component: ModelList,
            children: [{ path: ":id", Component: ModelEdit }],
          },
        ],
      },
    ],
  },
  {
    path: "*",
    Component: CatchAllRedirect,
  },
]);
