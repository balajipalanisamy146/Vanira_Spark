import { Bell, Search } from "lucide-react";

export default function Topbar(){

  return(

    <div className="
      h-20
      border-b
      border-blue-900
      flex
      items-center
      justify-between
      px-8
    ">

      <div
        className="
        flex
        items-center
        gap-3
        bg-[#0B1730]
        px-4
        py-3
        rounded-xl
        w-[500px]
      "
      >

        <Search size={18}/>

        <input
          className="
          bg-transparent
          outline-none
          w-full
          "
          placeholder="
          Search products, customers, orders...
          "
        />

      </div>

      <div className="flex gap-6 items-center">

        <Bell/>

        <div className="flex gap-3 items-center">

          <div
            className="
            w-10
            h-10
            rounded-full
            bg-purple-500
            "
          />

          <div>

            <div>Shop Owner</div>

            <div className="text-gray-400 text-sm">
              Owner
            </div>

          </div>

        </div>

      </div>

    </div>
  )
}