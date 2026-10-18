import { useState } from "react";

import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import UploadSales from "./pages/UploadSales";
import Forecasting from "./pages/Forecasting";
import Customers from "./pages/Customers";
import CustomerAnalyticsDetail from "./pages/CustomerAnalyticsDetail";
import SalesAnalytics from "./pages/SalesAnalytics";
import Products from "./pages/Products";
import ProductAnalyticsDetail from "./pages/ProductAnalyticsDetail";
import Inventory from "./pages/Inventory";
import DataQuality from "./pages/DataQuality";
import AIInsights from "./pages/AIInsights";

function App() {

    const [activePage, setActivePage] = useState("Dashboard");
    const [selectedProduct, setSelectedProduct] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState("");

    const navigateToPage = (page) => {
        setSelectedProduct("");
        setSelectedCustomer("");
        setActivePage(page);
    };

    const renderPage = () => {

        switch (activePage) {

            case "Sales Upload":
                return (
                    <UploadSales
                        onViewInvalidRecords={() => navigateToPage("Data Quality")}
                    />
                );

            case "Data Quality":
                return <DataQuality />;

            case "Forecasting":
                return <Forecasting />;

            case "Customers Analytics":
                return selectedCustomer ? (
                    <CustomerAnalyticsDetail
                        key={selectedCustomer}
                        customerId={selectedCustomer}
                        onBack={() => setSelectedCustomer("")}
                    />
                ) : (
                    <Customers onSelectCustomer={setSelectedCustomer} />
                );
            
            case "Sales Analytics":
                return <SalesAnalytics />;

            case "Product Analytics":
                return selectedProduct ? (
                    <ProductAnalyticsDetail
                        key={selectedProduct}
                        productName={selectedProduct}
                        onBack={() => setSelectedProduct("")}
                    />
                ) : (
                    <Products onSelectProduct={setSelectedProduct} />
                );

            case "Inventory":
                return <Inventory />;

            case "AI Insights":
                return <AIInsights />;

            case "Dashboard":
            default:
                return <Dashboard onNavigate={navigateToPage} />;

        }
    };

    return (

        <div className="flex min-h-screen">

            <Sidebar
                activePage={activePage}
                setActivePage={navigateToPage}
            />

            {renderPage()}

        </div>

    );
}

export default App;