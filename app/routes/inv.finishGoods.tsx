import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import MetaVRFinishedGoodsTable from "../components/controlKpi/meta-vr-finished-goods-table"
import MetaVRAgingDashboard from "../components/controlKpi/meta-vr-aging-dashboard"

import InvProj from "../components/supplychain/Invproj"


import { Button } from "../components/ui/button"
import { ArrowLeft } from "lucide-react"
import { Link } from "@remix-run/react"



export default function RawMaterial() {
 
  
  return (
    <div className="w-full space-y-6">
    <Link className="" to={`/inv/supplyChain`}>
    <Button variant="breadcrumb" size="sm">
      <ArrowLeft className="h-4 w-4 mr-2" />
      Back to Supply Chain Control Tower
    </Button>
  </Link>
    <Tabs className="" defaultValue="inv-projection">
        
      <TabsList>
      <TabsTrigger value="inv-projection">Inventory Projection</TabsTrigger>
        <TabsTrigger value="finished-goods">Finished Goods</TabsTrigger>
        <TabsTrigger value="aging-dashboard">Aging Dashboard</TabsTrigger>
       
      </TabsList> <TabsContent value="inv-projection">
        <InvProj />
      </TabsContent>
      <TabsContent value="finished-goods">
        <MetaVRFinishedGoodsTable />
      </TabsContent>

      <TabsContent value="aging-dashboard">
        <MetaVRAgingDashboard />
      </TabsContent>

     
    </Tabs>
    </div>
  )
}