import { createBrowserRouter } from "react-router";

import { MembersView } from "./views/Members";
import { PaymentsView } from "./views/Payments";
import { LockersView } from "./views/Lockers";
import { MedicalCertificatesView } from "./views/MedicalCertificates";
import { HomeView } from "./views/Home";
import { SportsView } from "./views/Sports";
import { DisciplinesView } from "./views/Disciplines";
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
      {
        path: "/medical-certificates",
        Component: MedicalCertificatesView,
      },
      {
        path: "/sports",
        Component: SportsView,
      },
      {
        path: "/disciplines",
        Component: DisciplinesView,
      },
    ],
  },
]);
