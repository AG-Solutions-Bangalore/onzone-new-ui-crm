import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import moment from "moment";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  TableHead,
} from "@/components/ui/table";
import axios from "axios";
import BASE_URL from "@/config/BaseUrl";
import { ButtonConfig } from "@/config/ButtonConfig";

const PaymentDetailsDialog = ({ isOpen, onClose, invoiceNo }) => {
  const [viewData, setViewData] = useState([]);

  useEffect(() => {
    if (!isOpen || !invoiceNo) return;

    const fetchPaymentDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${BASE_URL}/api/panel-fetch-invoice-payment-by-invoiceno/${invoiceNo}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setViewData(response.data.paymentSubView || []);
      } catch (error) {
        console.error("Error fetching payment details:", error);
      }
    };

    fetchPaymentDetails();

    return () => {
      setViewData([]);
    };
  }, [isOpen, invoiceNo]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl [&>button]:hidden">
        <div className="flex justify-between items-center border-b pb-2">
          <DialogTitle className="text-lg font-semibold text-gray-800">
            Payment Details
          </DialogTitle>
          <DialogClose asChild>
            <X
              className="h-5 w-5 cursor-pointer text-gray-500 hover:text-red-500 transition duration-200"
              onClick={onClose}
            />
          </DialogClose>
        </div>
        {viewData && viewData.length > 0 ? (
          <Table>
            <TableHeader
              className={` ${ButtonConfig.tableHeader} ${ButtonConfig.tableLabel}`}
            >
              <TableRow>
                {[
                  "P Date",
                  "Adj Adv",
                  "Adj Dp",
                  "Adj Da",
                  "Bank Ch",
                  "Discount",
                  "Shortage",
                ].map((header, idx) => (
                  <TableHead
                    key={idx}
                    className="px-4 py-2 font-semibold text-gray-700"
                  >
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {viewData.map((pending, index) => (
                <TableRow key={index} className="hover:bg-gray-50">
                  <TableCell>
                    {moment(pending.invoiceP_date).format("DD-MMM-YYYY")}
                  </TableCell>
                  <TableCell>{pending.invoicePSub_amt_adv}</TableCell>
                  <TableCell>{pending.invoicePSub_amt_dp}</TableCell>
                  <TableCell>{pending.invoicePSub_amt_da}</TableCell>
                  <TableCell>{pending.invoicePSub_bank_c}</TableCell>
                  <TableCell>{pending.invoicePSub_discount}</TableCell>
                  <TableCell>{pending.invoicePSub_shortage}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-4">No data available</div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDetailsDialog;
