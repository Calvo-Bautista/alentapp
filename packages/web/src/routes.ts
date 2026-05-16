import { createBrowserRouter } from "react-router";

import { MembersView } from "./views/Members";
import { PaymentsView } from "./views/Payments";
import { LockersView } from "./views/Lockers";
import { HomeView } from "./views/Home";
import Layout from "./Layout";

export let router = createBrowserRouter([
  {
    Component: Layout,
    children: [
      {
        path: "/",
        Component: HomeView,
      },
      {
        path: "/members",
        Component: MembersView,
      },
      {
        path: "/payments",
        Component: PaymentsView,
      },
      {
        path: "/lockers",
        Component: LockersView,
      },
    ],
  },
]);
