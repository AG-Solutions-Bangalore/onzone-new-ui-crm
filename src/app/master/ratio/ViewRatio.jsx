

import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import ReactToPrint from 'react-to-print';
import axios from 'axios'
import BASE_URL from '@/config/BaseUrl';
import { Loader, Printer } from 'lucide-react';
import Page from '@/app/dashboard/page';
import { ErrorComponent, LoaderComponent } from '@/components/LoaderComponent/LoaderComponent';
const tablelabel = { fontWeight: 'bold' };
const tablecss = { fontSize: '12px' };
const ViewRatio = () => {
    const {id} = useParams()
    const componentRef = useRef();
    const [ratio, setRatio] = useState({});

     const [loader, setLoader]= useState(true);
           const [isError, setIsError] = useState(false);

           const fetchRatioData = async () => {
                           setLoader(true);
                           setIsError(false);
                           try {
                               const res = await axios({
                                   url: BASE_URL + "/api/fetch-ratio-by-id/" + id,
                                   method: "GET",
                                   headers: {
                                       Authorization: `Bearer ${localStorage.getItem("token")}`,
                                   },
                               });
                                setRatio(res.data.ratio);
                           } catch (error) {
                               console.error("Error fetching ratio:", error);
                               setIsError(true);
                           } finally {
                               setLoader(false); 
                           }
                       };
                       useEffect(() => {
                       fetchRatioData();
                   }, [id]);
  if (loader) {
            return <LoaderComponent name="Work Order Ratio Data" />; 
          }
        
          // Render error state
          if (isError) {
            return (
              <ErrorComponent
                message="Error Fetching Ratio Data"
                refetch={fetchRatioData}
              />
            );
          }
  return (
   <Page>
    <div className="w-full max-w-6xl mx-auto space-y-6 pt-2 pb-8">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#FDFBF7] border border-stone-200/80 p-5 rounded-2xl shadow-2xs gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-[#A27B5C]">Master / Ratio</span>
          <h3 className="font-heading text-xl md:text-2xl font-bold text-stone-800 tracking-tight">
            Ratio #{id}
          </h3>
        </div>

        <div className={localStorage.getItem("user_type_id") == 4 ? "hidden" : ""}>
          <ReactToPrint
            trigger={() => (
              <button className="flex items-center gap-2 px-4 py-2 bg-[#A27B5C] hover:bg-[#8C6547] text-white text-sm font-medium rounded-xl shadow-xs transition-colors cursor-pointer">
                <Printer size={16} />
                Print Matrix
              </button>
            )}
            content={() => componentRef.current}
          />
        </div>
      </div>

      {/* Main Ratio Card */}
      <div className="bg-white border border-stone-200/80 shadow-xs rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-6 overflow-x-auto" ref={componentRef}>
          <div className="min-w-[700px]" style={{ fontSize: '14px' }}>
            <table className="w-full border-collapse border border-stone-300 rounded-lg overflow-hidden">
              <thead>
                <tr style={{ background: '#A27B5C', textAlign: 'center', color: 'white' }}>
                  <th className="p-2.5 font-semibold text-xs uppercase tracking-wider border border-stone-400/40">Swatch</th>
                  <th className="p-2.5 font-semibold text-xs uppercase tracking-wider border border-stone-400/40">Mtrs</th>
                  <th className="p-2.5 font-semibold text-xs uppercase tracking-wider border border-stone-400/40">Sleeve</th>
                  <th className="p-2.5 font-semibold text-xs uppercase tracking-wider border border-stone-400/40">Cons</th>
                  <th className="p-2.5 font-semibold text-xs uppercase tracking-wider border border-stone-400/40">
                    <span className="block mb-1">Size</span>
                    <div className="flex justify-around border-t border-white/20 pt-1 font-normal text-xs">
                      <span>36</span>
                      <span>38</span>
                      <span>40</span>
                      <span>42</span>
                      <span>44</span>
                      <span>46</span>
                      <span>48</span>
                      <span>50</span>
                    </div>
                  </th>
                  <th className="p-2.5 font-semibold text-xs uppercase tracking-wider border border-stone-400/40">Total</th>
                </tr>
              </thead>
              <tbody>
                {ratio && Array.isArray(ratio) && ratio.map((fabricsub, key) => (
                  <React.Fragment key={key}>
                    <tr className="border-b border-stone-200">
                      <td rowSpan={5} className="border border-stone-300 text-center p-2"><span style={tablecss}></span></td>
                      <td rowSpan={5} className="border border-stone-300 text-center p-2 font-medium text-stone-700"><span style={tablecss}>{fabricsub.ratio_mtr}</span></td>
                      <td className="border border-stone-300 text-center p-2"><span className="font-bold text-stone-800" style={tablecss}>Half</span></td>
                      <td className="border border-stone-300 text-center p-2"><span className="font-bold text-stone-800" style={tablecss}>1.2</span></td>
                      <td className="border border-stone-300 p-2">
                        <div className="flex justify-around">
                          <span className="font-bold text-stone-700" style={tablecss}>0</span>
                          <span className="font-bold text-stone-700" style={tablecss}>0</span>
                          <span className="font-bold text-stone-700" style={tablecss}>0</span>
                          <span className="font-bold text-stone-700" style={tablecss}>0</span>
                          <span className="font-bold text-stone-700" style={tablecss}>0</span>
                          <span className="font-bold text-stone-700" style={tablecss}>0</span>
                          <span className="font-bold text-stone-700" style={tablecss}>0</span>
                          <span className="font-bold text-stone-700" style={tablecss}>0</span>
                        </div>
                      </td>
                      <td className="border border-stone-300 text-center p-2"><span style={tablecss}>0</span></td>
                    </tr>
                    <tr className="border-b border-stone-200">
                      <td rowSpan={3} className="border border-stone-300 text-center p-2"><span style={tablecss}></span></td>
                      <td className="border border-stone-300 text-center p-2"><span className="font-medium text-stone-600" style={tablecss}>PCS</span></td>
                      <td className="border border-stone-300 p-2">
                        <div className="flex justify-around text-stone-700">
                          <span style={tablecss}>{fabricsub.ratio_36_pcs}</span>
                          <span style={tablecss}>{fabricsub.ratio_38_pcs}</span>
                          <span style={tablecss}>{fabricsub.ratio_40_pcs}</span>
                          <span style={tablecss}>{fabricsub.ratio_42_pcs}</span>
                          <span style={tablecss}>{fabricsub.ratio_44_pcs}</span>
                          <span style={tablecss}>{fabricsub.ratio_46_pcs}</span>
                          <span style={tablecss}>{fabricsub.ratio_48_pcs}</span>
                          <span style={tablecss}>{fabricsub.ratio_50_pcs}</span>
                        </div>
                      </td>
                      <td rowSpan={4} className="border border-stone-300 text-center p-2 font-semibold text-stone-800 bg-[#F5F2EB]/30"><span style={tablecss}>{fabricsub.ratio_total}</span></td>
                    </tr>
                    <tr className="border-b border-stone-200">
                      <td className="border border-stone-300 text-center p-2"><span className="font-medium text-stone-600" style={tablecss}>RATIO</span></td>
                      <td className="border border-stone-300 p-2">
                        <div className="flex justify-around text-stone-700">
                          <span style={tablecss}>{fabricsub.ratio_36_ratio}</span>
                          <span style={tablecss}>{fabricsub.ratio_38_ratio}</span>
                          <span style={tablecss}>{fabricsub.ratio_40_ratio}</span>
                          <span style={tablecss}>{fabricsub.ratio_42_ratio}</span>
                          <span style={tablecss}>{fabricsub.ratio_44_ratio}</span>
                          <span style={tablecss}>{fabricsub.ratio_46_ratio}</span>
                          <span style={tablecss}>{fabricsub.ratio_48_ratio}</span>
                          <span style={tablecss}>{fabricsub.ratio_50_ratio}</span>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b border-stone-200">
                      <td className="border border-stone-300 text-center p-2"><span className="font-medium text-stone-600" style={tablecss}>BITS</span></td>
                      <td className="border border-stone-300 p-2">
                        <div className="flex justify-around text-stone-700">
                          <span style={tablecss}>{fabricsub.ratio_36_bits}</span>
                          <span style={tablecss}>{fabricsub.ratio_38_bits}</span>
                          <span style={tablecss}>{fabricsub.ratio_40_bits}</span>
                          <span style={tablecss}>{fabricsub.ratio_42_bits}</span>
                          <span style={tablecss}>{fabricsub.ratio_44_bits}</span>
                          <span style={tablecss}>{fabricsub.ratio_46_bits}</span>
                          <span style={tablecss}>{fabricsub.ratio_48_bits}</span>
                          <span style={tablecss}>{fabricsub.ratio_50_bits}</span>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b border-stone-200 bg-[#F5F2EB]/40">
                      <td className="border border-stone-300 text-center p-2"><span className="font-bold text-stone-800" style={tablecss}>Full</span></td>
                      <td className="border border-stone-300 text-center p-2"><span className="font-bold text-stone-800" style={tablecss}>1.4</span></td>
                      <td className="border border-stone-300 p-2">
                        <div className="flex justify-around font-bold text-stone-800">
                          <span style={tablecss}>{(fabricsub.ratio_36_pcs || 0) + (fabricsub.ratio_36_ratio || 0) + (fabricsub.ratio_36_bits || 0)}</span>
                          <span style={tablecss}>{(fabricsub.ratio_38_pcs || 0) + (fabricsub.ratio_38_ratio || 0) + (fabricsub.ratio_38_bits || 0)}</span>
                          <span style={tablecss}>{(fabricsub.ratio_40_pcs || 0) + (fabricsub.ratio_40_ratio || 0) + (fabricsub.ratio_40_bits || 0)}</span>
                          <span style={tablecss}>{(fabricsub.ratio_42_pcs || 0) + (fabricsub.ratio_42_ratio || 0) + (fabricsub.ratio_42_bits || 0)}</span>
                          <span style={tablecss}>{(fabricsub.ratio_44_pcs || 0) + (fabricsub.ratio_44_ratio || 0) + (fabricsub.ratio_44_bits || 0)}</span>
                          <span style={tablecss}>{(fabricsub.ratio_46_pcs || 0) + (fabricsub.ratio_46_ratio || 0) + (fabricsub.ratio_46_bits || 0)}</span>
                          <span style={tablecss}>{(fabricsub.ratio_48_pcs || 0) + (fabricsub.ratio_48_ratio || 0) + (fabricsub.ratio_48_bits || 0)}</span>
                          <span style={tablecss}>{(fabricsub.ratio_50_pcs || 0) + (fabricsub.ratio_50_ratio || 0) + (fabricsub.ratio_50_bits || 0)}</span>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
   </Page>
  );
};

export default ViewRatio;