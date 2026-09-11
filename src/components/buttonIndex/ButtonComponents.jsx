import { Button } from "@/components/ui/button";
import {
  Download,
  Edit,
  Eye,
  FilePlus2,
  MinusCircle,
  Printer,
  SquarePlus,
  Trash,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { checkPermission } from "./checkPermission";
import React, { forwardRef } from "react";

const getStaticPermissions = () => {
  const buttonPermissions = localStorage.getItem("buttonControl");
  try {
    return buttonPermissions ? JSON.parse(buttonPermissions) : [];
  } catch (error) {
    console.error(
      "Error parsing StaticPermission data from localStorage",
      error
    );
    return [];
  }
};
////////invoice
export const InvoiceCreate = ({ onClick, className }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "InvoiceCreate", staticPermissions)) {
    return null;
  }

  return (
    <Button variant="default" className={className} onClick={onClick}>
      <SquarePlus className="h-4 w-4" /> Invoice
    </Button>
  );
};
InvoiceCreate.page = "Invoice";

// export const InvoiceEdit = ({ onClick, className }) => {
//   const userId = localStorage.getItem("id") || "";
//   const staticPermissions = getStaticPermissions();
//   if (!checkPermission(userId, "InvoiceEdit", staticPermissions)) {
//     return null;
//   }

//   return (
//     <Button onClick={onClick} className={className} variant="ghost" size="icon">
//       <Edit className="h-4 w-4 text-black" />
//     </Button>
//   );
// };
// InvoiceEdit.page = "Invoice";
// export const InvoiceView = ({ onClick, className }) => {
//   const userId = localStorage.getItem("id") || "";
//   const staticPermissions = getStaticPermissions();
//   if (!checkPermission(userId, "InvoiceView", staticPermissions)) {
//     return null;
//   }

//   return (
//     <Button
//       onClick={onClick}
//       className={className}
//       title="View"
//       variant="ghost"
//       size="icon"
//     >
//       <Eye className="h-4 w-4 text-black" />
//     </Button>
//   );
// };
// InvoiceView.page = "Invoice";
// export const InvoiceDocument = ({ onClick, className }) => {
//   const userId = localStorage.getItem("id") || "";
//   const staticPermissions = getStaticPermissions();
//   if (!checkPermission(userId, "InvoiceDocument", staticPermissions)) {
//     return null;
//   }

//   return (
//     <Button
//       onClick={onClick}
//       className={className}
//       title="Invoice Document"
//       variant="ghost"
//       size="icon"
//     >
//       <FilePlus2 className="h-4 w-4 text-black" />
//     </Button>
//   );
// };
// InvoiceDocument.page = "Invoice";
// export const InvoiceDelete = ({ onClick, className }) => {
//   const userId = localStorage.getItem("id") || "";
//   const staticPermissions = getStaticPermissions();
//   if (!checkPermission(userId, "InvoiceDelete", staticPermissions)) {
//     return null;
//   }

//   return (
//     <Button
//       onClick={onClick}
//       className={className}
//       title="Invoice Delete"
//       variant="ghost"
//       size="icon"
//     >
//       <Trash className="h-4 w-4 text-red-500" />
//     </Button>
//   );
// };
// InvoiceDelete.page = "Invoice";
export const InvoiceEdit = forwardRef(({ onClick, className }, ref) => {
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();

  if (!checkPermission(userId, "InvoiceEdit", staticPermissions)) {
    return null;
  }

  return (
    <Button
      ref={ref}
      onClick={onClick}
      className={className}
      variant="ghost"
      size="icon"
    >
      <Edit className="h-4 w-4 text-black" />
    </Button>
  );
});
InvoiceEdit.page = "Invoice";

// ===================== InvoiceView =====================
export const InvoiceView = forwardRef(({ onClick, className }, ref) => {
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();

  if (!checkPermission(userId, "InvoiceView", staticPermissions)) {
    return null;
  }

  return (
    <Button
      ref={ref}
      onClick={onClick}
      className={className}
      title="View"
      variant="ghost"
      size="icon"
    >
      <Eye className="h-4 w-4 text-black" />
    </Button>
  );
});
InvoiceView.page = "Invoice";

// ===================== InvoiceDocument =====================
export const InvoiceDocument = forwardRef(({ onClick, className }, ref) => {
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();

  if (!checkPermission(userId, "InvoiceDocument", staticPermissions)) {
    return null;
  }

  return (
    <Button
      ref={ref}
      onClick={onClick}
      className={className}
      title="Invoice Document"
      variant="ghost"
      size="icon"
    >
      <FilePlus2 className="h-4 w-4 text-black" />
    </Button>
  );
});
InvoiceDocument.page = "Invoice";

// ===================== InvoiceDelete =====================
export const InvoiceDelete = forwardRef(({ onClick, className }, ref) => {
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();

  if (!checkPermission(userId, "InvoiceDelete", staticPermissions)) {
    return null;
  }

  return (
    <Button
      ref={ref}
      onClick={onClick}
      className={className}
      title="Invoice Delete"
      variant="ghost"
      size="icon"
    >
      <Trash className="h-4 w-4 text-red-500" />
    </Button>
  );
});
InvoiceDelete.page = "Invoice";
////////contract
export const ContractCreate = ({ onClick, className }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "ContractCreate", staticPermissions)) {
    return null;
  }

  return (
    <Button variant="default" className={className} onClick={onClick}>
      <SquarePlus className="h-4 w-4" /> Contract
    </Button>
  );
};
ContractCreate.page = "Contract";

// export const ContractEdit = ({ onClick, className }) => {
//   const userId = localStorage.getItem("id") || "";
//   const staticPermissions = getStaticPermissions();
//   if (!checkPermission(userId, "ContractEdit", staticPermissions)) {
//     return null;
//   }

//   return (
//     <Button onClick={onClick} className={className} variant="ghost" size="icon">
//       <Edit className="h-4 w-4 text-black" />
//     </Button>
//   );
// };
// ContractEdit.page = "Contract";
// export const ContractView = ({ onClick, className }) => {
//   const userId = localStorage.getItem("id") || "";
//   const staticPermissions = getStaticPermissions();
//   if (!checkPermission(userId, "ContractView", staticPermissions)) {
//     return null;
//   }

//   return (
//     <Button
//       onClick={onClick}
//       className={className}
//       title="View"
//       variant="ghost"
//       size="icon"
//     >
//       <Eye className="h-4 w-4 text-black" />
//     </Button>
//   );
// };
// ContractView.page = "Contract";

// export const ContractDelete = ({ onClick, className }) => {
//   const userId = localStorage.getItem("id") || "";
//   const staticPermissions = getStaticPermissions();
//   if (!checkPermission(userId, "ContractDelete", staticPermissions)) {
//     return null;
//   }

//   return (
//     <Button
//       onClick={onClick}
//       className={className}
//       title="Invoice Delete"
//       variant="ghost"
//       size="icon"
//     >
//       <Trash className="h-4 w-4 text-red-500" />
//     </Button>
//   );
// };
// ContractDelete.page = "Contract";
// ===================== ContractEdit =====================
export const ContractEdit = forwardRef(({ onClick, className }, ref) => {
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();

  if (!checkPermission(userId, "ContractEdit", staticPermissions)) {
    return null;
  }

  return (
    <Button
      ref={ref}
      onClick={onClick}
      className={className}
      variant="ghost"
      size="icon"
    >
      <Edit className="h-4 w-4 text-black" />
    </Button>
  );
});
ContractEdit.page = "Contract";

// ===================== ContractView =====================
export const ContractView = forwardRef(({ onClick, className }, ref) => {
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();

  if (!checkPermission(userId, "ContractView", staticPermissions)) {
    return null;
  }

  return (
    <Button
      ref={ref}
      onClick={onClick}
      className={className}
      title="View"
      variant="ghost"
      size="icon"
    >
      <Eye className="h-4 w-4 text-black" />
    </Button>
  );
});
ContractView.page = "Contract";

// ===================== ContractDelete =====================
export const ContractDelete = forwardRef(({ onClick, className }, ref) => {
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();

  if (!checkPermission(userId, "ContractDelete", staticPermissions)) {
    return null;
  }

  return (
    <Button
      ref={ref}
      onClick={onClick}
      className={className}
      title="Contract Delete"
      variant="ghost"
      size="icon"
    >
      <Trash className="h-4 w-4 text-red-500" />
    </Button>
  );
});
ContractDelete.page = "Contract";
////////MASTER-BRANCH
export const BranchCreate = ({ onClick, className }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "BranchCreate", staticPermissions)) {
    return null;
  }

  return (
    <Button variant="default" className={className} onClick={onClick}>
      <SquarePlus className="h-4 w-4" /> Company
    </Button>
  );
};
BranchCreate.page = "Branch";

// export const BranchEdit = ({ onClick, className }) => {
//   const userId = localStorage.getItem("id") || "";
//   const staticPermissions = getStaticPermissions();
//   if (!checkPermission(userId, "BranchEdit", staticPermissions)) {
//     return null;
//   }

//   return (
//     <Button onClick={onClick} className={className} variant="ghost" size="icon">
//       <Edit className="h-4 w-4 text-black" />
//     </Button>
//   );
// };
// BranchEdit.page = "Branch";

export const BranchEdit = forwardRef(({ onClick, className }, ref) => {
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();

  if (!checkPermission(userId, "BranchEdit", staticPermissions)) {
    return null;
  }

  return (
    <Button
      ref={ref}
      onClick={onClick}
      className={className}
      variant="ghost"
      size="icon"
    >
      <Edit className="h-4 w-4 text-black" />
    </Button>
  );
});

BranchEdit.page = "Branch";

////////MASTER-State
export const StateCreate = ({ onClick, className }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "StateCreate", staticPermissions)) {
    return null;
  }

  return (
    <Button variant="default" className={className} onClick={onClick}>
      <SquarePlus className="h-4 w-4" /> State
    </Button>
  );
};
StateCreate.page = "State";

export const StateEdit = ({ onClick, className }) => {
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "StateEdit", staticPermissions)) {
    return null;
  }

  return (
    <Button onClick={onClick} className={className} variant="ghost" size="icon">
      <Edit className="h-4 w-4 text-black" />
    </Button>
  );
};
StateEdit.page = "State";
////////MASTER-Bank
export const BankCreate = ({ onClick, className }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "BankCreate", staticPermissions)) {
    return null;
  }

  return (
    <Button variant="default" className={className} onClick={onClick}>
      <SquarePlus className="h-4 w-4" /> Bank
    </Button>
  );
};
BankCreate.page = "Bank";

// export const BankEdit = ({ onClick, className }) => {
//   const userId = localStorage.getItem("id") || "";
//   const staticPermissions = getStaticPermissions();
//   if (!checkPermission(userId, "BankEdit", staticPermissions)) {
//     return null;
//   }

//   return (
//     <Button onClick={onClick} className={className} variant="ghost" size="icon">
//       <Edit className="h-4 w-4 text-black" />
//     </Button>
//   );
// };
// BankEdit.page = "Bank";
export const BankEdit = forwardRef(({ onClick, className }, ref) => {
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();

  if (!checkPermission(userId, "BankEdit", staticPermissions)) {
    return null;
  }

  return (
    <Button
      ref={ref}
      onClick={onClick}
      className={className}
      variant="ghost"
      size="icon"
    >
      <Edit className="h-4 w-4 text-black" />
    </Button>
  );
});

BankEdit.page = "Bank";
////////MASTER-Scheme
export const SchemeCreate = ({ onClick, className }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "SchemeCreate", staticPermissions)) {
    return null;
  }

  return (
    <Button variant="default" className={className} onClick={onClick}>
      <SquarePlus className="h-4 w-4" /> Scheme
    </Button>
  );
};
SchemeCreate.page = "Scheme";

// export const SchemeEdit = ({ onClick, className }) => {
//   const userId = localStorage.getItem("id") || "";
//   const staticPermissions = getStaticPermissions();
//   if (!checkPermission(userId, "SchemeEdit", staticPermissions)) {
//     return null;
//   }

//   return (
//     <Button onClick={onClick} className={className} variant="ghost" size="icon">
//       <Edit className="h-4 w-4 text-black" />
//     </Button>
//   );
// };
// SchemeEdit.page = "Scheme";
export const SchemeEdit = forwardRef(({ onClick, className }, ref) => {
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();

  if (!checkPermission(userId, "SchemeEdit", staticPermissions)) {
    return null;
  }

  return (
    <Button
      ref={ref}
      onClick={onClick}
      className={className}
      variant="ghost"
      size="icon"
    >
      <Edit className="h-4 w-4 text-black" />
    </Button>
  );
});

SchemeEdit.page = "Scheme";
////////MASTER-Country
export const CountryCreate = ({ onClick, className }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "CountryCreate", staticPermissions)) {
    return null;
  }

  return (
    <Button variant="default" className={className} onClick={onClick}>
      <SquarePlus className="h-4 w-4" /> Country
    </Button>
  );
};
CountryCreate.page = "Country";

// export const CountryEdit = ({ onClick, className }) => {
//   const userId = localStorage.getItem("id") || "";
//   const staticPermissions = getStaticPermissions();
//   if (!checkPermission(userId, "CountryEdit", staticPermissions)) {
//     return null;
//   }

//   return (
//     <Button onClick={onClick} className={className} variant="ghost" size="icon">
//       <Edit className="h-4 w-4 text-black" />
//     </Button>
//   );
// };
// CountryEdit.page = "Country";
export const CountryEdit = forwardRef(({ onClick, className }, ref) => {
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();

  if (!checkPermission(userId, "CountryEdit", staticPermissions)) {
    return null;
  }

  return (
    <Button
      ref={ref}
      onClick={onClick}
      className={className}
      variant="ghost"
      size="icon"
    >
      <Edit className="h-4 w-4 text-black" />
    </Button>
  );
});

CountryEdit.page = "Country";
////////MASTER-Container Size
export const ContainerSizeCreate = ({ onClick, className }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "ContainerSizeCreate", staticPermissions)) {
    return null;
  }

  return (
    <Button variant="default" className={className} onClick={onClick}>
      <SquarePlus className="h-4 w-4" /> Container Size
    </Button>
  );
};
ContainerSizeCreate.page = "Container Size";

export const ContainerSizeEdit = ({ onClick, className }) => {
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "ContainerSizeEdit", staticPermissions)) {
    return null;
  }

  return (
    <Button onClick={onClick} className={className} variant="ghost" size="icon">
      <Edit className="h-4 w-4 text-black" />
    </Button>
  );
};
ContainerSizeEdit.page = "Container Size";

////////MASTER-Payment TermsC
export const PaymentTermsCCreate = ({ onClick, className }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "PaymentTermsCCreate", staticPermissions)) {
    return null;
  }

  return (
    <Button variant="default" className={className} onClick={onClick}>
      <SquarePlus className="h-4 w-4" /> Payment TermsC
    </Button>
  );
};
PaymentTermsCCreate.page = "Payment TermsC";

export const PaymentTermsCEdit = ({ onClick, className }) => {
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "PaymentTermsCEdit", staticPermissions)) {
    return null;
  }

  return (
    <Button onClick={onClick} className={className} variant="ghost" size="icon">
      <Edit className="h-4 w-4 text-black" />
    </Button>
  );
};
PaymentTermsCEdit.page = "Payment TermsC";
////////MASTER-Description of Goods
export const DescriptionofGoodsCreate = ({ onClick, className }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "DescriptionofGoodsCreate", staticPermissions)) {
    return null;
  }

  return (
    <Button variant="default" className={className} onClick={onClick}>
      <SquarePlus className="h-4 w-4" /> Description of Goods
    </Button>
  );
};
DescriptionofGoodsCreate.page = "Description of Goods";

export const DescriptionofGoodsEdit = ({ onClick, className }) => {
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "DescriptionofGoodsEdit", staticPermissions)) {
    return null;
  }

  return (
    <Button onClick={onClick} className={className} variant="ghost" size="icon">
      <Edit className="h-4 w-4 text-black" />
    </Button>
  );
};
DescriptionofGoodsEdit.page = "Description of Goods";
////////MASTER-Bag Type
export const BagTypeCreate = ({ onClick, className }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "BagTypeCreate", staticPermissions)) {
    return null;
  }

  return (
    <Button variant="default" className={className} onClick={onClick}>
      <SquarePlus className="h-4 w-4" /> Bag Type
    </Button>
  );
};
BagTypeCreate.page = "Bag Type";

export const BagTypeEdit = ({ onClick, className }) => {
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "BagTypeEdit", staticPermissions)) {
    return null;
  }

  return (
    <Button onClick={onClick} className={className} variant="ghost" size="icon">
      <Edit className="h-4 w-4 text-black" />
    </Button>
  );
};
BagTypeEdit.page = "Bag Type";
////////MASTER-CustomDescription
export const CustomDescriptionCreate = ({ onClick, className }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "CustomDescriptionCreate", staticPermissions)) {
    return null;
  }

  return (
    <Button variant="default" className={className} onClick={onClick}>
      <SquarePlus className="h-4 w-4" /> Custom Description
    </Button>
  );
};
CustomDescriptionCreate.page = "Custom Description";

export const CustomDescriptionEdit = ({ onClick, className }) => {
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "CustomDescriptionEdit", staticPermissions)) {
    return null;
  }

  return (
    <Button onClick={onClick} className={className} variant="ghost" size="icon">
      <Edit className="h-4 w-4 text-black" />
    </Button>
  );
};
CustomDescriptionEdit.page = "Custom Description";
////////MASTER-TypeCreate
export const TypeCreate = ({ onClick, className }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "TypeCreate", staticPermissions)) {
    return null;
  }

  return (
    <Button variant="default" className={className} onClick={onClick}>
      <SquarePlus className="h-4 w-4" /> Type
    </Button>
  );
};
TypeCreate.page = "Type";

export const TypeEdit = ({ onClick, className }) => {
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "TypeEdit", staticPermissions)) {
    return null;
  }

  return (
    <Button onClick={onClick} className={className} variant="ghost" size="icon">
      <Edit className="h-4 w-4 text-black" />
    </Button>
  );
};
TypeEdit.page = "Type";
////////MASTER-Quality
export const QualityCreate = ({ onClick, className }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "QualityCreate", staticPermissions)) {
    return null;
  }

  return (
    <Button variant="default" className={className} onClick={onClick}>
      <SquarePlus className="h-4 w-4" /> Quality
    </Button>
  );
};
QualityCreate.page = "Quality";

export const QualityEdit = ({ onClick, className }) => {
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "QualityEdit", staticPermissions)) {
    return null;
  }

  return (
    <Button onClick={onClick} className={className} variant="ghost" size="icon">
      <Edit className="h-4 w-4 text-black" />
    </Button>
  );
};
QualityEdit.page = "Quality";
////////MASTER-Item
export const ItemCreate = ({ onClick, className }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "ItemCreate", staticPermissions)) {
    return null;
  }

  return (
    <Button variant="default" className={className} onClick={onClick}>
      <SquarePlus className="h-4 w-4" /> Item
    </Button>
  );
};
ItemCreate.page = "Item";

export const ItemEdit = ({ onClick, className }) => {
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "ItemEdit", staticPermissions)) {
    return null;
  }

  return (
    <Button onClick={onClick} className={className} variant="ghost" size="icon">
      <Edit className="h-4 w-4 text-black" />
    </Button>
  );
};
ItemEdit.page = "Item";
////////MASTER-Marking
export const MarkingCreate = ({ onClick, className }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "MarkingCreate", staticPermissions)) {
    return null;
  }

  return (
    <Button variant="default" className={className} onClick={onClick}>
      <SquarePlus className="h-4 w-4" /> Marking
    </Button>
  );
};
MarkingCreate.page = "Marking";

export const MarkingEdit = ({ onClick, className }) => {
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "MarkingEdit", staticPermissions)) {
    return null;
  }

  return (
    <Button onClick={onClick} className={className} variant="ghost" size="icon">
      <Edit className="h-4 w-4 text-black" />
    </Button>
  );
};
MarkingEdit.page = "Marking";

//
////////MASTER-Port of Loading
export const PortofLoadingCreate = ({ onClick, className }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "PortofLoadingCreate", staticPermissions)) {
    return null;
  }

  return (
    <Button variant="default" className={className} onClick={onClick}>
      <SquarePlus className="h-4 w-4" /> Port of Loading
    </Button>
  );
};
PortofLoadingCreate.page = "Port of Loading";

export const PortofLoadingEdit = ({ onClick, className }) => {
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "PortofLoadingEdit", staticPermissions)) {
    return null;
  }

  return (
    <Button onClick={onClick} className={className} variant="ghost" size="icon">
      <Edit className="h-4 w-4 text-black" />
    </Button>
  );
};
PortofLoadingEdit.page = "Port of Loading";
////////MASTER-GR Code
export const GRCodeCreate = ({ onClick, className }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "GRCodeCreate", staticPermissions)) {
    return null;
  }

  return (
    <Button variant="default" className={className} onClick={onClick}>
      <SquarePlus className="h-4 w-4" /> GR Code
    </Button>
  );
};
GRCodeCreate.page = "GR Code";

export const GRCodeEdit = ({ onClick, className }) => {
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "GRCodeEdit", staticPermissions)) {
    return null;
  }

  return (
    <Button onClick={onClick} className={className} variant="ghost" size="icon">
      <Edit className="h-4 w-4 text-black" />
    </Button>
  );
};
GRCodeEdit.page = "GR Code";
////////MASTER-Product
export const ProductCreate = ({ onClick, className }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "ProductCreate", staticPermissions)) {
    return null;
  }

  return (
    <Button variant="default" className={className} onClick={onClick}>
      <SquarePlus className="h-4 w-4" /> Product
    </Button>
  );
};
ProductCreate.page = "Product";

export const ProductEdit = ({ onClick, className }) => {
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "ProductEdit", staticPermissions)) {
    return null;
  }

  return (
    <Button onClick={onClick} className={className} variant="ghost" size="icon">
      <Edit className="h-4 w-4 text-black" />
    </Button>
  );
};
ProductEdit.page = "Product";
////////MASTER-Product Description
export const ProductDescriptionCreate = ({ onClick, className }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "ProductDescriptionCreate", staticPermissions)) {
    return null;
  }

  return (
    <Button variant="default" className={className} onClick={onClick}>
      <SquarePlus className="h-4 w-4" /> Custom Description
    </Button>
  );
};
ProductDescriptionCreate.page = "Product Description";

export const ProductDescriptionEdit = ({ onClick, className }) => {
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "ProductDescriptionEdit", staticPermissions)) {
    return null;
  }

  return (
    <Button onClick={onClick} className={className} variant="ghost" size="icon">
      <Edit className="h-4 w-4 text-black" />
    </Button>
  );
};
ProductDescriptionEdit.page = "Product Description";
////////MASTER-Shipper
export const ShipperCreate = ({ onClick, className }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "ShipperCreate", staticPermissions)) {
    return null;
  }

  return (
    <Button variant="default" className={className} onClick={onClick}>
      <SquarePlus className="h-4 w-4" /> Shipper
    </Button>
  );
};
ShipperCreate.page = "Shipper";

export const ShipperEdit = ({ onClick, className }) => {
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "ShipperEdit", staticPermissions)) {
    return null;
  }

  return (
    <Button onClick={onClick} className={className} variant="ghost" size="icon">
      <Edit className="h-4 w-4 text-black" />
    </Button>
  );
};
ShipperEdit.page = "Shipper";
////////MASTER-Vessel
export const VesselCreate = ({ onClick, className }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "VesselCreate", staticPermissions)) {
    return null;
  }

  return (
    <Button variant="default" className={className} onClick={onClick}>
      <SquarePlus className="h-4 w-4" /> Vessel
    </Button>
  );
};
VesselCreate.page = "Vessel";

export const VesselEdit = ({ onClick, className }) => {
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "VesselEdit", staticPermissions)) {
    return null;
  }

  return (
    <Button onClick={onClick} className={className} variant="ghost" size="icon">
      <Edit className="h-4 w-4 text-black" />
    </Button>
  );
};
VesselEdit.page = "Vessel";
////////MASTER-Pre Recepits
export const PreRecepitsCreate = ({ onClick, className }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "PreRecepitsCreate", staticPermissions)) {
    return null;
  }

  return (
    <Button variant="default" className={className} onClick={onClick}>
      <SquarePlus className="h-4 w-4" /> Pre Recepits
    </Button>
  );
};
PreRecepitsCreate.page = "Pre Recepits";

export const PreRecepitsEdit = ({ onClick, className }) => {
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "PreRecepitsEdit", staticPermissions)) {
    return null;
  }

  return (
    <Button onClick={onClick} className={className} variant="ghost" size="icon">
      <Edit className="h-4 w-4 text-black" />
    </Button>
  );
};
PreRecepitsEdit.page = "Pre Recepits";
////////REPORT-BuyerR
export const BuyerRDownload = ({ onClick, className }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "BuyerRDownload", staticPermissions)) {
    return null;
  }

  return (
    <Button variant="default" className={className} onClick={onClick}>
      <Download className="h-4 w-4" /> Download
    </Button>
  );
};
BuyerRDownload.page = "BuyerR";
export const BuyerRPrint = ({ onClick, className }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "BuyerRPrint", staticPermissions)) {
    return null;
  }

  return (
    <Button variant="default" className={className} onClick={onClick}>
      <Printer className="h-4 w-4" /> Print
    </Button>
  );
};
BuyerRPrint.page = "BuyerR";
////////REPORT-"ContractR"

export const ContractRDownload = ({ onClick, className }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "ContractRDownload", staticPermissions)) {
    return null;
  }

  return (
    <Button variant="default" className={className} onClick={onClick}>
      <Download className="h-4 w-4" /> Download
    </Button>
  );
};
ContractRDownload.page = "ContractR";
export const ContractRView = ({ onClick, className }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "ContractRView", staticPermissions)) {
    return null;
  }

  return (
    <Button variant="default" className={className} onClick={onClick}>
      Open Report
    </Button>
  );
};
ContractRView.page = "ContractR";
////////REPORT-"SalesAccount"

export const SalesAccountDownload = ({ onClick, className }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "SalesAccountDownload", staticPermissions)) {
    return null;
  }

  return (
    <Button variant="default" className={className} onClick={onClick}>
      <Download className="h-4 w-4" /> Download
    </Button>
  );
};
SalesAccountDownload.page = "Sales Accounts";
export const SalesAccountView = ({ onClick, className }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "SalesAccountView", staticPermissions)) {
    return null;
  }

  return (
    <Button variant="default" className={className} onClick={onClick}>
      Open Report
    </Button>
  );
};
SalesAccountView.page = "Sales Accounts";

////////REPORT-"DutuDrawBack"

export const DutyDrawBackDownload = ({ onClick, className }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "DutyDrawBackDownload", staticPermissions)) {
    return null;
  }

  return (
    <Button variant="default" className={className} onClick={onClick}>
      <Download className="h-4 w-4" /> Download
    </Button>
  );
};
DutyDrawBackDownload.page = "DutyDrawBack";
export const DutyDrawBackView = ({ onClick, className }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "DutyDrawBackView", staticPermissions)) {
    return null;
  }

  return (
    <Button variant="default" className={className} onClick={onClick}>
      Open Report
    </Button>
  );
};
DutyDrawBackView.page = "DutyDrawBack";
////////REPORT-"Sales Data"

export const SalesDataDownload = ({ onClick, className }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "SalesDataDownload", staticPermissions)) {
    return null;
  }

  return (
    <Button variant="default" className={className} onClick={onClick}>
      <Download className="h-4 w-4" /> Download
    </Button>
  );
};
SalesDataDownload.page = "Sales Summary";
export const SalesDataView = ({ onClick, className }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "SalesDataView", staticPermissions)) {
    return null;
  }

  return (
    <Button variant="default" className={className} onClick={onClick}>
      Open Report
    </Button>
  );
};
SalesDataView.page = "Sales Summary";
//PAYMENT
////////REPORT-"PurchaseSummary"

export const PurchaseSummaryDownload = ({ onClick, className }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "PurchaseSummaryDownload", staticPermissions)) {
    return null;
  }

  return (
    <Button variant="default" className={className} onClick={onClick}>
      <Download className="h-4 w-4" /> Download
    </Button>
  );
};
PurchaseSummaryDownload.page = "Purchase Summary";
export const PurchaseSummaryVendorView = ({ onClick, className }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (
    !checkPermission(userId, "PurchaseSummaryVendorView", staticPermissions)
  ) {
    return null;
  }

  return (
    <Button variant="default" className={className} onClick={onClick}>
      Vendor Wise
    </Button>
  );
};
PurchaseSummaryVendorView.page = "Purchase Summary";
export const PurchaseSummaryCompanyView = ({ onClick, className }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (
    !checkPermission(userId, "PurchaseSummaryCompanyView", staticPermissions)
  ) {
    return null;
  }

  return (
    <Button variant="default" className={className} onClick={onClick}>
      Company Wise
    </Button>
  );
};
PurchaseSummaryCompanyView.page = "Purchase Summary";
export const ProductStockView = ({ onClick, className }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "ProductStockView", staticPermissions)) {
    return null;
  }

  return (
    <Button variant="default" className={className} onClick={onClick}>
      Stock Report
    </Button>
  );
};
ProductStockView.page = "Product Stock";
//PAYMENT
////////Payment
export const PaymentCreate = ({ onClick, className }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "PaymentCreate", staticPermissions)) {
    return null;
  }

  return (
    <Button variant="default" className={className} onClick={onClick}>
      <SquarePlus className="h-4 w-4" /> Payment
    </Button>
  );
};
PaymentCreate.page = "Payment";

//Purchase page
//Purchase Order List
export const PurchaseOrderCreate = ({ onClick, className }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "PurchaseOrderCreate", staticPermissions)) {
    return null;
  }

  return (
    <Button variant="default" className={className} onClick={onClick}>
      <SquarePlus className="h-4 w-4" /> Purchase Order
    </Button>
  );
};
PurchaseOrderCreate.page = "Purchase Order";

// export const PurchaseOrderEdit = ({ onClick, className }) => {
//   const userId = localStorage.getItem("id") || "";
//   const staticPermissions = getStaticPermissions();
//   if (!checkPermission(userId, "PurchaseOrderEdit", staticPermissions)) {
//     return null;
//   }

//   return (
//     <Tooltip>
//       <TooltipTrigger asChild>
//         <Button
//           onClick={onClick}
//           className={className}
//           variant="ghost"
//           size="icon"
//         >
//           <Edit className="h-4 w-4 text-black" />
//         </Button>
//       </TooltipTrigger>
//       <TooltipContent>Edit Purchase Order</TooltipContent>
//     </Tooltip>
//   );
// };
// PurchaseOrderEdit.page = "Purchase Order";
export const PurchaseOrderEdit = forwardRef(({ onClick, className }, ref) => {
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();

  if (!checkPermission(userId, "PurchaseOrderEdit", staticPermissions)) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          ref={ref}
          onClick={onClick}
          className={className}
          variant="ghost"
          size="icon"
        >
          <Edit className="h-4 w-4 text-black" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Edit Purchase Order</TooltipContent>
    </Tooltip>
  );
});
PurchaseOrderEdit.page = "Purchase Order";
export const PurchaseOrderView = ({ onClick, className }) => {
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "PurchaseOrderView", staticPermissions)) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={onClick}
            className={className}
            variant="ghost"
            size="icon"
          >
            <Eye className="h-4 w-4 text-black" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>View Purchase Order</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
PurchaseOrderView.page = "Purchase Order";
//Purchase  List
export const PurchaseCreate = ({ onClick, className }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "PurchaseCreate", staticPermissions)) {
    return null;
  }

  return (
    <Button variant="default" className={className} onClick={onClick}>
      <SquarePlus className="h-4 w-4" /> Market Purchase
    </Button>
  );
};
PurchaseCreate.page = "Purchase";

export const PurchaseEdit = ({ onClick, className }) => {
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "PurchaseEdit", staticPermissions)) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={onClick}
          className={className}
          variant="ghost"
          size="icon"
        >
          <Edit className="h-4 w-4 text-black" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Edit Purchase</TooltipContent>
    </Tooltip>
  );
};
PurchaseEdit.page = "Purchase";
//Production  List
export const ProductionCreate = ({ onClick, className }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "ProductionCreate", staticPermissions)) {
    return null;
  }

  return (
    <Button variant="default" className={className} onClick={onClick}>
      <SquarePlus className="h-4 w-4" /> Market Purchase
    </Button>
  );
};
ProductionCreate.page = "Production";

export const ProductionEdit = ({ onClick, className }) => {
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "ProductionEdit", staticPermissions)) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={onClick}
          className={className}
          variant="ghost"
          size="icon"
        >
          <Edit className="h-4 w-4 text-black" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Edit Production</TooltipContent>
    </Tooltip>
  );
};
ProductionEdit.page = "Production";
export const ProductionDelete = ({ onClick, className }) => {
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "ProductionDelete", staticPermissions)) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={onClick}
          className={className}
          variant="ghost"
          size="icon"
        >
          <Trash className="h-4 w-4  text-red-500 " />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Delete Production</TooltipContent>
    </Tooltip>
  );
};
ProductionDelete.page = "Production";

export const ProductionremoveRow = ({ onClick, className }) => {
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "ProductionremoveRow", staticPermissions)) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={onClick}
          className={className}
          variant="ghost"
          size="icon"
        >
          <MinusCircle className="h-4 w-4  text-red-500 " />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Delete Production</TooltipContent>
    </Tooltip>
  );
};
ProductionremoveRow.page = "Production";

//Processing  List
export const ProcessingCreate = ({ onClick, className }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "ProcessingCreate", staticPermissions)) {
    return null;
  }

  return (
    <Button variant="default" className={className} onClick={onClick}>
      <SquarePlus className="h-4 w-4" /> Processing
    </Button>
  );
};
ProcessingCreate.page = "Processing";

export const ProcessingEdit = ({ onClick, className }) => {
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "ProcessingEdit", staticPermissions)) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={onClick}
          className={className}
          variant="ghost"
          size="icon"
        >
          <Edit className="h-4 w-4 text-black" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Edit Processing</TooltipContent>
    </Tooltip>
  );
};
ProcessingEdit.page = "Processing";
export const ProcessingDelete = ({ onClick, className }) => {
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "ProcessingDelete", staticPermissions)) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={onClick}
          className={className}
          variant="ghost"
          size="icon"
        >
          <Trash className="h-4 w-4  text-red-500 " />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Delete Processing</TooltipContent>
    </Tooltip>
  );
};
ProcessingDelete.page = "Processing";
//DutyDrawBackPending
export const DutyDrawBackPendingEdit = ({ onClick, className }) => {
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "DutyDrawBackPendingEdit", staticPermissions)) {
    return null;
  }

  return (
    <Button onClick={onClick} className={className} variant="ghost" size="icon">
      <Edit className="h-4 w-4 text-black" />
    </Button>
  );
};
DutyDrawBackPendingEdit.page = "Pending";
//DutyDrawBackReceived
export const DutyDrawBackReceivedEdit = ({ onClick, className }) => {
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "DutyDrawBackReceivedEdit", staticPermissions)) {
    return null;
  }

  return (
    <Button onClick={onClick} className={className} variant="ghost" size="icon">
      <Edit className="h-4 w-4 text-black" />
    </Button>
  );
};
DutyDrawBackReceivedEdit.page = "Received";
// -------------------------Costing------------------------------
//Costing  List
export const CostingCreate = ({ onClick, className }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "CostingCreate", staticPermissions)) {
    return null;
  }

  return (
    <Button variant="default" className={className} onClick={onClick}>
      <SquarePlus className="h-4 w-4" /> Costing
    </Button>
  );
};
CostingCreate.page = "Costing";

export const CostingEdit = ({ onClick, className }) => {
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "CostingEdit", staticPermissions)) {
    return null;
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={onClick}
          className={className}
          variant="ghost"
          size="icon"
        >
          <Edit className="h-4 w-4 text-black" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Edit Costing</TooltipContent>
    </Tooltip>
  );
};
CostingEdit.page = "Costing";

export const CostingView = ({ onClick, className }) => {
  const userId = localStorage.getItem("id") || "";
  const staticPermissions = getStaticPermissions();
  if (!checkPermission(userId, "CostingView", staticPermissions)) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={onClick}
            className={className}
            variant="ghost"
            size="icon"
          >
            <Eye className="h-4 w-4 text-black" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>View Costing</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
CostingView.page = "Costing";

export default {
  InvoiceCreate,
  InvoiceEdit,
  InvoiceView,
  InvoiceDocument,
  InvoiceDelete,
  ContractCreate,
  ContractEdit,
  ContractView,
  ContractDelete,
  BranchCreate,
  BranchEdit,
  StateCreate,
  StateEdit,
  BankCreate,
  BankEdit,
  SchemeCreate,
  SchemeEdit,
  CountryCreate,
  CountryEdit,
  ContainerSizeCreate,
  ContainerSizeEdit,
  PaymentTermsCCreate,
  PaymentTermsCEdit,
  DescriptionofGoodsCreate,
  DescriptionofGoodsEdit,
  BagTypeCreate,
  BagTypeEdit,
  CustomDescriptionCreate,
  CustomDescriptionEdit,
  TypeCreate,
  TypeEdit,
  QualityCreate,
  QualityEdit,
  ItemCreate,
  ItemEdit,
  MarkingCreate,
  MarkingEdit,
  PortofLoadingCreate,
  PortofLoadingEdit,
  GRCodeCreate,
  GRCodeEdit,
  ProductCreate,
  ProductEdit,
  ProductDescriptionCreate,
  ProductDescriptionEdit,
  ShipperCreate,
  ShipperEdit,
  VesselCreate,
  VesselEdit,
  PreRecepitsCreate,
  PreRecepitsEdit,
  BuyerRDownload,
  BuyerRPrint,
  ContractRDownload,
  ContractRView,
  SalesAccountDownload,

  SalesAccountView,
  DutyDrawBackDownload,
  DutyDrawBackView,
  SalesDataDownload,
  SalesDataView,
  PurchaseSummaryDownload,
  PurchaseSummaryVendorView,
  PurchaseSummaryCompanyView,
  ProductStockView,
  PaymentCreate,
  PurchaseOrderCreate,
  PurchaseOrderEdit,
  PurchaseOrderView,
  PurchaseCreate,
  PurchaseEdit,
  ProductionCreate,
  ProductionEdit,
  ProductionDelete,
  ProductionremoveRow,
  ProcessingCreate,
  ProcessingEdit,
  ProcessingDelete,
  DutyDrawBackPendingEdit,
  DutyDrawBackReceivedEdit,
  CostingCreate,
  CostingEdit,
  CostingView,
};
