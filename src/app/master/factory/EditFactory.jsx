


import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft, Send } from 'lucide-react'
import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import BASE_URL from '@/config/BaseUrl'
import { ErrorComponent, LoaderComponent } from '@/components/LoaderComponent/LoaderComponent'
import Page from '@/app/dashboard/page'


const statusOptions = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
]

const factorySchema = z.object({
  factory_name: z.string()
    .min(1, "Factory name is required")
    .regex(/^[A-Za-z ]+$/, "Only letters and spaces allowed"),
  factory_address: z.string().min(1, "Address is required"),
  factory_gstin: z.string().min(1, "GSTIN is required"),
  factory_contact_name: z.string()
    .min(1, "Contact name is required")
    .regex(/^[A-Za-z ]+$/, "Only letters and spaces allowed"),
  factory_contact_mobile: z.string()
    .regex(/^\d{10}$/, "Mobile number must be exactly 10 digits"),
  factory_contact_email: z.string()
    .min(1, "Email is required")
    .email("Invalid email format"),
  factory_status: z.string().min(1, "Status is required"),
})

const EditFactory = () => {
  const { id } = useParams()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [errors, setErrors] = useState({})
  
  const [factory, setFactory] = useState({
    factory_name: "",
    factory_address: "",
    factory_gstin: "",
    factory_contact_name: "",
    factory_contact_mobile: "",
    factory_status: "",
    factory_contact_email: "",
  })

 

  
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['factory', id],
    queryFn: async () => {
      const response = await axios.get(
        `${BASE_URL}/api/fetch-factory-by-id/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      )
      return response.data
    },
    retry: 1,
  })

 
  useEffect(() => {
    if (data?.factory) {
      setFactory(data.factory)
    }
  }, [data])

 
  

 
  const updateFactoryMutation = useMutation({
    mutationFn: async (factoryData) => {
      const response = await axios({
        url: `${BASE_URL}/api/update-factory/${id}?_method=PUT`,
        method: "POST",
        data: factoryData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      return response.data
    },
    onSuccess: (data) => {
      if (data.code === 200) {
        toast({
          title: "Success",
          description: `${data.msg}`,
        })
        navigate("/master/factory")
      } else {
        throw new Error("Duplicate Entry")
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.msg.includes("duplicate") 
          ? "Duplicate entry found" 
          : "Failed to update factory",
      })
    }
  })

  const validateOnlyDigits = (value) => {
    return /^\d*$/.test(value)
  }

  const validateOnlyText = (value) => {
    return value === "" || /^[A-Za-z ]*$/.test(value)
  }

  const onInputChange = (e) => {
    const { name, value } = e.target
    
   
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }

    if (name === "factory_contact_mobile") {
      if (validateOnlyDigits(value) && value.length <= 10) {
        setFactory(prev => ({ ...prev, [name]: value }))
      }
    } else if (name === "factory_contact_name" || name === "factory_name") {
      if (validateOnlyText(value)) {
        setFactory(prev => ({ ...prev, [name]: value }))
      }
    } else {
      setFactory(prev => ({ ...prev, [name]: value }))
    }
  }

  const onSelectChange = (name, value) => {
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
    setFactory(prev => ({ ...prev, [name]: value }))
  }

  const onSubmit = (e) => {
    e.preventDefault()
    setErrors({})

    try {
      const validatedData = factorySchema.parse(factory)
      updateFactoryMutation.mutate(validatedData)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = {}
        error.errors.forEach(err => {
          fieldErrors[err.path[0]] = err.message
        })
        setErrors(fieldErrors)
        
       
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: error.errors[0].message,
        })
      }
    }
  }

    if (isLoading) {
      return <LoaderComponent name="Loading factory data..." />;
    }
  
    if (isError) {
      return (
        <ErrorComponent
          message="Error loading factory data"
          refetch={refetch}
        />
      );
    }
 

  return (
    <Page>
      <div className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-bold text-stone-800 tracking-tight">
              Edit Factory
            </h1>
            <p className="text-xs md:text-sm text-stone-500 font-medium">
              Update factory details, contact coordinates, and status
            </p>
          </div>
          <Link to="/master/factory">
            <Button variant="outline" className="border-stone-200 text-stone-700 hover:bg-stone-50 rounded-xl gap-2 shadow-2xs">
              <ArrowLeft className="h-4 w-4" /> Back to Factories
            </Button>
          </Link>
        </div>

        {/* Main Form Card */}
        <Card className="rounded-2xl border border-stone-200/80 bg-white shadow-xs overflow-hidden">
          <CardHeader className="bg-[#FBF9F5] border-b border-stone-200/80 px-6 py-4">
            <CardTitle className="font-heading text-lg font-bold text-stone-800">
              Factory Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={onSubmit} className="space-y-6">
              {/* First Row - Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Factory Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="factory_name" className="text-xs font-semibold text-stone-700">
                    Factory Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="factory_name"
                    name="factory_name"
                    value={factory.factory_name}
                    onChange={onInputChange}
                    placeholder="Enter factory name"
                    className={`bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-[#A27B5C]/20 rounded-xl text-stone-800 ${
                      errors.factory_name ? "border-destructive" : ""
                    }`}
                  />
                  {errors.factory_name && (
                    <p className="text-xs text-destructive">{errors.factory_name}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="factory_contact_email" className="text-xs font-semibold text-stone-700">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="factory_contact_email"
                    name="factory_contact_email"
                    type="email"
                    value={factory.factory_contact_email}
                    onChange={onInputChange}
                    placeholder="Enter email address"
                    className={`bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-[#A27B5C]/20 rounded-xl text-stone-800 ${
                      errors.factory_contact_email ? "border-destructive" : ""
                    }`}
                  />
                  {errors.factory_contact_email && (
                    <p className="text-xs text-destructive">{errors.factory_contact_email}</p>
                  )}
                </div>

                {/* Address */}
                <div className="space-y-1.5">
                  <Label htmlFor="factory_address" className="text-xs font-semibold text-stone-700">
                    Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="factory_address"
                    name="factory_address"
                    value={factory.factory_address}
                    onChange={onInputChange}
                    placeholder="Enter factory address"
                    className={`bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-[#A27B5C]/20 rounded-xl text-stone-800 ${
                      errors.factory_address ? "border-destructive" : ""
                    }`}
                  />
                  {errors.factory_address && (
                    <p className="text-xs text-destructive">{errors.factory_address}</p>
                  )}
                </div>
              </div>

              {/* Second Row - Contact & Business Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {/* GSTIN */}
                <div className="space-y-1.5">
                  <Label htmlFor="factory_gstin" className="text-xs font-semibold text-stone-700">
                    GSTIN <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="factory_gstin"
                    name="factory_gstin"
                    value={factory.factory_gstin}
                    onChange={onInputChange}
                    placeholder="Enter GSTIN number"
                    className={`bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-[#A27B5C]/20 rounded-xl text-stone-800 uppercase ${
                      errors.factory_gstin ? "border-destructive" : ""
                    }`}
                  />
                  {errors.factory_gstin && (
                    <p className="text-xs text-destructive">{errors.factory_gstin}</p>
                  )}
                </div>

                {/* Contact Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="factory_contact_name" className="text-xs font-semibold text-stone-700">
                    Contact Person Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="factory_contact_name"
                    name="factory_contact_name"
                    value={factory.factory_contact_name}
                    onChange={onInputChange}
                    placeholder="Enter contact person name"
                    className={`bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-[#A27B5C]/20 rounded-xl text-stone-800 ${
                      errors.factory_contact_name ? "border-destructive" : ""
                    }`}
                  />
                  {errors.factory_contact_name && (
                    <p className="text-xs text-destructive">{errors.factory_contact_name}</p>
                  )}
                </div>

                {/* Mobile Number */}
                <div className="space-y-1.5">
                  <Label htmlFor="factory_contact_mobile" className="text-xs font-semibold text-stone-700">
                    Mobile Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="factory_contact_mobile"
                    name="factory_contact_mobile"
                    value={factory.factory_contact_mobile}
                    onChange={onInputChange}
                    placeholder="Enter 10-digit mobile number"
                    maxLength={10}
                    className={`bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-[#A27B5C]/20 rounded-xl text-stone-800 ${
                      errors.factory_contact_mobile ? "border-destructive" : ""
                    }`}
                  />
                  {errors.factory_contact_mobile && (
                    <p className="text-xs text-destructive">{errors.factory_contact_mobile}</p>
                  )}
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-stone-700">
                    Status <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={factory.factory_status}
                    onValueChange={(value) => onSelectChange('factory_status', value)}
                  >
                    <SelectTrigger className={`bg-white border-stone-200 focus:border-[#A27B5C] rounded-xl text-stone-800 ${
                      errors.factory_status ? "border-destructive" : ""
                    }`}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-stone-200 rounded-xl shadow-lg">
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.factory_status && (
                    <p className="text-xs text-destructive">{errors.factory_status}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                <Link to="/master/factory">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="border-stone-200 text-stone-700 hover:bg-stone-50 rounded-xl px-5"
                  >
                    Cancel
                  </Button>
                </Link>

                <Button
                  type="submit"
                  disabled={updateFactoryMutation.isPending}
                  className="bg-[#A27B5C] hover:bg-[#8C6547] text-white shadow-sm rounded-xl font-medium px-6 py-2.5 gap-2"
                >
                  {updateFactoryMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Page>
  )
}

export default EditFactory