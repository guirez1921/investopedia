import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
    layout("layout/Layout.tsx", [
        index("pages/Index.tsx" ),
        route("/login", "pages/Login.tsx" ),
        route("/signup", "pages/Signup.tsx" ),
        route("/stocks", "pages/Stocks.tsx" ),
        route("/markets", "pages/Markets.tsx" ),
        route("/currencies", "pages/Currencies.tsx" ),
        route("/global", "pages/Global.tsx" ),
        route("/portfolio", "pages/Portfolio.tsx" ),
        route("/performance", "pages/Performance.tsx" ),
        route("/analysis", "pages/Analysis.tsx" ),
        route("/settings", "pages/Settings.tsx" ),
        // ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE
        route( "*", "pages/NotFound.tsx" ),
    ]),
] satisfies RouteConfig;
