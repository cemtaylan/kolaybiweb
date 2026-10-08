// Payload yönetim paneli (/admin) ve API (/api) için kök yerleşim
import config from '@payload-config'
import '@payloadcms/next/css'
import type { ServerFunctionClient } from 'payload'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import type React from 'react'
import { importMap } from './admin/importMap.js'
import './custom.css'
import '../../public/css/popups.css' // açılır pencere önizlemesi sitedeki stil dosyasını kullanır

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({ ...args, config, importMap })
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  )
}
