import { lazy } from "react";
import { Route, Routes } from "react-router-dom";
import AuthRoute from "./AuthRoute";
import ProtectedRoute from "./ProtectedRoute";
import Login from "@/app/auth/Login";
import ForgotPassword from "@/components/ForgotPassword/ForgotPassword";

import OrderFormView from "@/app/order-form/OrderFormView";
import CreateOrderForm from "@/app/order-form/CreateOrderForm";
import OrderFormList from "@/app/order-form/OrderFormList";
import EditOrderForm from "@/app/order-form/EditOrderForm";
import PublicCreateOrderForm from "@/app/order-form/PublicCreateOrderForm";
import CreateStock from "@/app/stock/CreateStock";
import FactoryOrderReceived from "@/app/orderReceived/FactoryOrderReceived";
import StickerPrinting from "@/app/Sticker/StickerPrinting";

// import Home from "@/app/home/Home";
// import BrandList from "@/app/master/brand/BrandList";
// import EditBrand from "@/app/master/brand/EditBrand";
// import FactoryList from "@/app/master/factory/FactoryList";
// import AddFactory from "@/app/master/factory/AddFactory";
// import EditFactory from "@/app/master/factory/EditFactory";
// import StyleList from "@/app/master/style/StyleList";
// import WidthList from "@/app/master/width/WidthList";
// import RetailerList from "@/app/master/retailer/RetailerList";
// import AddRetailer from "@/app/master/retailer/AddRetailer";
// import EditRetailer from "@/app/master/retailer/EditRetailer";
// import RatioList from "@/app/master/ratio/RatioList";
// import ViewRatio from "@/app/master/ratio/ViewRatio";
// import HalfRatioList from "@/app/master/halfRatio/HalfRatioList";
// import AddHalfRatio from "@/app/master/halfRatio/AddHalfRatio";
// import EditHalfRatio from "@/app/master/halfRatio/EditHalfRatio";
// import WorkOrderList from "@/app/workOrder/WorkOrderList";
// import CreateWorkOrder from "@/app/workOrder/CreateWorkOrder";
// import EditWorkOrder from "@/app/workOrder/EditWorkOrder";
// import WorkOrderReceipt from "@/app/workOrder/WorkOrderReceipt";
// import WorkOrderMaterial from "@/app/workOrder/WorkOrderMaterial";
// import OrderReceivedList from "@/app/orderReceived/OrderReceivedList";
// import AddOrderReceived from "@/app/orderReceived/AddOrderReceived";
// import EditOrderReceived from "@/app/orderReceived/EditOrderReceived";
// import ViewOrderReceived from "@/app/orderReceived/ViewOrderReceived";
// import DcReceiptReceived from "@/app/orderReceived/DcReceiptReceived";
// import SalesList from "@/app/sales/SalesList";
// import CreateSales from "@/app/sales/CreateSales";
// import ViewSales from "@/app/sales/ViewSales";
// import EditSales from "@/app/sales/EditSales";
// import FinishedStockList from "@/app/finishedStock/FinishedStockList";
// import RetailerReport from "@/app/report/retailer/RetailerReport";
// import WorkOrderReport from "@/app/report/workOrder/WorkOrderReport";
// import ReceivedReport from "@/app/report/received/ReceivedReport";
// import SalesReport from "@/app/report/sales/SalesReport";
// import NotFound from "@/app/errors/NotFound";

const Home = lazy(() => import("@/app/home/Home"));
const BrandList = lazy(() => import("@/app/master/brand/BrandList"));
const EditBrand = lazy(() => import("@/app/master/brand/EditBrand"));
const FactoryList = lazy(() => import("@/app/master/factory/FactoryList"));
const AddFactory = lazy(() => import("@/app/master/factory/AddFactory"));
const EditFactory = lazy(() => import("@/app/master/factory/EditFactory"));
const StyleList = lazy(() => import("@/app/master/style/StyleList"));
const WidthList = lazy(() => import("@/app/master/width/WidthList"));
const RetailerList = lazy(() => import("@/app/master/retailer/RetailerList"));
const AddRetailer = lazy(() => import("@/app/master/retailer/AddRetailer"));
const EditRetailer = lazy(() => import("@/app/master/retailer/EditRetailer"));
const RatioList = lazy(() => import("@/app/master/ratio/RatioList"));
const ViewRatio = lazy(() => import("@/app/master/ratio/ViewRatio"));
const HalfRatioList = lazy(
  () => import("@/app/master/halfRatio/HalfRatioList"),
);
const AddHalfRatio = lazy(() => import("@/app/master/halfRatio/AddHalfRatio"));
const EditHalfRatio = lazy(
  () => import("@/app/master/halfRatio/EditHalfRatio"),
);
const WorkOrderList = lazy(() => import("@/app/workOrder/WorkOrderList"));
const CreateWorkOrder = lazy(() => import("@/app/workOrder/CreateWorkOrder"));
const EditWorkOrder = lazy(() => import("@/app/workOrder/EditWorkOrder"));
const WorkOrderReceipt = lazy(() => import("@/app/workOrder/WorkOrderReceipt"));
const WorkOrderMaterial = lazy(
  () => import("@/app/workOrder/WorkOrderMaterial"),
);
const OrderReceivedList = lazy(
  () => import("@/app/orderReceived/OrderReceivedList"),
);
const ReceivedList = lazy(
  () => import("@/app/orderReceived/ReceivedList"),
);
const AddOrderReceived = lazy(
  () => import("@/app/orderReceived/AddOrderReceived"),
);
const EditOrderReceived = lazy(
  () => import("@/app/orderReceived/EditOrderReceived"),
);
const ViewOrderReceived = lazy(
  () => import("@/app/orderReceived/ViewOrderReceived"),
);
const DcReceiptReceived = lazy(
  () => import("@/app/orderReceived/DcReceiptReceived"),
);
const SalesList = lazy(() => import("@/app/sales/SalesList"));
const CreateSales = lazy(() => import("@/app/sales/CreateSales"));
const ViewSales = lazy(() => import("@/app/sales/ViewSales"));
const EditSales = lazy(() => import("@/app/sales/EditSales"));
const FinishedStockList = lazy(
  () => import("@/app/finishedStock/FinishedStockList"),
);
const RetailerReport = lazy(
  () => import("@/app/report/retailer/RetailerReport"),
);
const WorkOrderReport = lazy(
  () => import("@/app/report/workOrder/WorkOrderReport"),
);
const ReceivedReport = lazy(
  () => import("@/app/report/received/ReceivedReport"),
);
const SalesReport = lazy(() => import("@/app/report/sales/SalesReport"));
const FairOrderFormList = lazy(
  () => import("@/app/fair-order-form/FairOrderFormList")
);
const CreateFairOrderForm = lazy(
  () => import("@/app/fair-order-form/CreateFairOrderForm")
);
const EditFairOrderForm = lazy(
  () => import("@/app/fair-order-form/EditFairOrderForm")
);
const FairOrderFormView = lazy(
  () => import("@/app/fair-order-form/FairOrderFormView")
);
const NotFound = lazy(() => import("@/app/errors/NotFound"));

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AuthRoute />}>
        <Route path="/" element={<Login />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/create-order" element={<PublicCreateOrderForm />} />
      </Route>

      <Route path="/" element={<ProtectedRoute />}>
        {/* Dashboard  */}

        <Route path="/home" element={<Home />} />
        {/* Master  */}
        <Route path="/master/brand" element={<BrandList />} />
        <Route path="/master/brand/edit-brand/:id" element={<EditBrand />} />

        <Route path="/master/factory" element={<FactoryList />} />
        <Route path="/master/factory/add-factory" element={<AddFactory />} />
        <Route
          path="/master/factory/edit-factory/:id"
          element={<EditFactory />}
        />
        {/*Dashboard */}
        <Route path="/sticker-printing" element={<StickerPrinting />} />

        <Route path="/master/style" element={<StyleList />} />
        <Route path="/master/width" element={<WidthList />} />

        <Route path="/master/retailer" element={<RetailerList />} />
        <Route path="/master/retailer/add-retailer" element={<AddRetailer />} />
        <Route
          path="/master/retailer/edit-retailer/:id"
          element={<EditRetailer />}
        />

        <Route path="/master/ratio" element={<RatioList />} />
        <Route path="/master/ratio/view-ratio/:id" element={<ViewRatio />} />

        <Route path="/master/half-ratio" element={<HalfRatioList />} />
        <Route
          path="/master/half-ratio/add-half-ratio"
          element={<AddHalfRatio />}
        />
        <Route
          path="/master/half-ratio/edit-half-ratio/:id"
          element={<EditHalfRatio />}
        />

        {/* work order  */}
        <Route path="/work-order" element={<WorkOrderList />} />
        <Route
          path="/work-order/create-work-order"
          element={<CreateWorkOrder />}
        />
        <Route
          path="/work-order/factory-create-work-order"
          element={<FactoryOrderReceived />}
        />
        <Route
          path="/work-order/edit-work-order/:id"
          element={<EditWorkOrder />}
        />

        <Route
          path="/work-order/view-work-order/:id"
          element={<WorkOrderReceipt />}
        />
        <Route
          path="/work-order/work-order-material/:id"
          element={<WorkOrderMaterial />}
        />
        {/* order received / factory outlet */}
        <Route path="/order-received" element={<OrderReceivedList />} />
        <Route path="/factory-outlet/received" element={<ReceivedList />} />
        <Route
          path="/order-received/add-order-received"
          element={<AddOrderReceived />}
        />
        <Route
          path="/factory-outlet/add-order-received"
          element={<AddOrderReceived />}
        />
        <Route
          path="/order-received/edit-order-received/:id"
          element={<EditOrderReceived />}
        />
        <Route
          path="/factory-outlet/edit-order-received/:id"
          element={<EditOrderReceived />}
        />
        <Route
          path="/order-received/view-order-received/:id"
          element={<ViewOrderReceived />}
        />
        <Route
          path="/factory-outlet/view-order-received/:id"
          element={<ViewOrderReceived />}
        />
        <Route
          path="/order-received/dc-receipt/:id"
          element={<DcReceiptReceived />}
        />
        <Route
          path="/factory-outlet/dc-receipt/:id"
          element={<DcReceiptReceived />}
        />
        {/* sales  */}
        <Route path="/sales" element={<SalesList />} />
        <Route path="/sales/add-sales" element={<CreateSales />} />
        <Route path="/sales/view-sales/:id" element={<ViewSales />} />
        <Route path="/sales/edit-sales/:id" element={<EditSales />} />

        {/* order form (old) */}
        <Route path="/order-form" element={<OrderFormList />} />
        <Route
          path="/order-form/create-order-form"
          element={<CreateOrderForm />}
        />
        <Route
          path="/order-form/view-order-form/:id"
          element={<OrderFormView />}
        />
        <Route
          path="/order-form/view-edit-form/:id"
          element={<EditOrderForm />}
        />

        {/* new order form (fair order form) */}
        <Route path="/fair-order-form" element={<FairOrderFormList />} />
        <Route
          path="/fair-order-form/create"
          element={<CreateFairOrderForm />}
        />
        <Route
          path="/fair-order-form/edit/:id"
          element={<EditFairOrderForm />}
        />
        <Route
          path="/fair-order-form/view/:id"
          element={<FairOrderFormView />}
        />

        {/* stock  */}
        <Route path="/create-stock" element={<CreateStock />} />
        {/* finished stock  */}
        <Route path="/finished-stock" element={<FinishedStockList />} />

        {/* finished stock  */}
        <Route path="/finished-stock" element={<FinishedStockList />} />
        {/* report  */}
        <Route path="/report/retailer-report" element={<RetailerReport />} />
        <Route path="/report/work-order-report" element={<WorkOrderReport />} />
        <Route path="/report/received-report" element={<ReceivedReport />} />
        <Route path="/report/sales-report" element={<SalesReport />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;
