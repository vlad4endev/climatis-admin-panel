export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          changes: Json | null
          created_at: string
          element_id: string | null
          element_name: string | null
          id: string
          section: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string
          element_id?: string | null
          element_name?: string | null
          id?: string
          section: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string
          element_id?: string | null
          element_name?: string | null
          id?: string
          section?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      assignments: {
        Row: {
          assignment_number: string
          comments: string | null
          created_at: string
          deleted_at: string | null
          estimate_id: string
          id: string
          request_id: string
          status: Database["public"]["Enums"]["assignment_status"]
          team_id: string
          updated_at: string
        }
        Insert: {
          assignment_number: string
          comments?: string | null
          created_at?: string
          deleted_at?: string | null
          estimate_id: string
          id?: string
          request_id: string
          status?: Database["public"]["Enums"]["assignment_status"]
          team_id: string
          updated_at?: string
        }
        Update: {
          assignment_number?: string
          comments?: string | null
          created_at?: string
          deleted_at?: string | null
          estimate_id?: string
          id?: string
          request_id?: string
          status?: Database["public"]["Enums"]["assignment_status"]
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          additional_contacts: Json | null
          company_name: string
          created_at: string
          deleted_at: string | null
          division: string | null
          email: string | null
          id: string
          main_contact_name: string
          notes: string | null
          phone: string
          requisites: string | null
          type: Database["public"]["Enums"]["client_type"]
          updated_at: string
        }
        Insert: {
          additional_contacts?: Json | null
          company_name: string
          created_at?: string
          deleted_at?: string | null
          division?: string | null
          email?: string | null
          id?: string
          main_contact_name: string
          notes?: string | null
          phone: string
          requisites?: string | null
          type?: Database["public"]["Enums"]["client_type"]
          updated_at?: string
        }
        Update: {
          additional_contacts?: Json | null
          company_name?: string
          created_at?: string
          deleted_at?: string | null
          division?: string | null
          email?: string | null
          id?: string
          main_contact_name?: string
          notes?: string | null
          phone?: string
          requisites?: string | null
          type?: Database["public"]["Enums"]["client_type"]
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          client_id: string
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          is_main: boolean
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          is_main?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          is_main?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      document_attachments: {
        Row: {
          created_at: string
          document_id: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
        }
        Update: {
          created_at?: string
          document_id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_attachments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          client_id: string
          contract_number: string
          contract_type: Database["public"]["Enums"]["contract_type"]
          created_at: string
          deleted_at: string | null
          end_date: string
          file_name: string | null
          file_path: string | null
          id: string
          notes: string | null
          object_id: string | null
          response_conditions: string | null
          start_date: string
          status: Database["public"]["Enums"]["document_status"]
          updated_at: string
        }
        Insert: {
          client_id: string
          contract_number: string
          contract_type?: Database["public"]["Enums"]["contract_type"]
          created_at?: string
          deleted_at?: string | null
          end_date: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          notes?: string | null
          object_id?: string | null
          response_conditions?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
        }
        Update: {
          client_id?: string
          contract_number?: string
          contract_type?: Database["public"]["Enums"]["contract_type"]
          created_at?: string
          deleted_at?: string | null
          end_date?: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          notes?: string | null
          object_id?: string | null
          response_conditions?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "service_objects"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string | null
          position: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          phone?: string | null
          position?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          position?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      estimate_attachments: {
        Row: {
          created_at: string
          estimate_id: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
        }
        Insert: {
          created_at?: string
          estimate_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
        }
        Update: {
          created_at?: string
          estimate_id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estimate_attachments_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_materials: {
        Row: {
          created_at: string
          estimate_id: string
          id: string
          material_name: string
          price_per_unit: number | null
          quantity: number | null
          sort_order: number | null
          spare_part_id: string | null
        }
        Insert: {
          created_at?: string
          estimate_id: string
          id?: string
          material_name: string
          price_per_unit?: number | null
          quantity?: number | null
          sort_order?: number | null
          spare_part_id?: string | null
        }
        Update: {
          created_at?: string
          estimate_id?: string
          id?: string
          material_name?: string
          price_per_unit?: number | null
          quantity?: number | null
          sort_order?: number | null
          spare_part_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimate_materials_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_estimate_materials_spare_part"
            columns: ["spare_part_id"]
            isOneToOne: false
            referencedRelation: "spare_parts"
            referencedColumns: ["id"]
          },
        ]
      }
      estimates: {
        Row: {
          created_at: string
          created_by_id: string | null
          customer_calculation: Json | null
          deleted_at: string | null
          engineer_comment: string | null
          estimate_date: string
          estimate_number: string
          id: string
          name: string
          request_id: string | null
          status: Database["public"]["Enums"]["estimate_status"]
          type: Database["public"]["Enums"]["estimate_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_id?: string | null
          customer_calculation?: Json | null
          deleted_at?: string | null
          engineer_comment?: string | null
          estimate_date?: string
          estimate_number: string
          id?: string
          name: string
          request_id?: string | null
          status?: Database["public"]["Enums"]["estimate_status"]
          type?: Database["public"]["Enums"]["estimate_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_id?: string | null
          customer_calculation?: Json | null
          deleted_at?: string | null
          engineer_comment?: string | null
          estimate_date?: string
          estimate_number?: string
          id?: string
          name?: string
          request_id?: string | null
          status?: Database["public"]["Enums"]["estimate_status"]
          type?: Database["public"]["Enums"]["estimate_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "estimates_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          client_id: string | null
          created_at: string
          estimate_id: string | null
          id: string
          invoice_date: string
          invoice_number: string
          request_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          updated_at: string
        }
        Insert: {
          amount?: number
          client_id?: string | null
          created_at?: string
          estimate_id?: string | null
          id?: string
          invoice_date?: string
          invoice_number: string
          request_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          client_id?: string | null
          created_at?: string
          estimate_id?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          request_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      monitoring_logs: {
        Row: {
          created_at: string
          details: Json | null
          element: string | null
          event_type: string
          id: string
          message: string | null
          page: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          element?: string | null
          event_type: string
          id?: string
          message?: string | null
          page?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          element?: string | null
          event_type?: string
          id?: string
          message?: string | null
          page?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      requests: {
        Row: {
          actual_end_time: string | null
          actual_start_time: string | null
          assigned_engineer_id: string | null
          assigned_team_id: string | null
          client_id: string
          comments: string | null
          contract_conditions: string | null
          contract_id: string | null
          created_at: string
          deleted_at: string | null
          desired_date: string | null
          hours_spent: number | null
          id: string
          object_id: string
          planned_visit_date: string | null
          priority: Database["public"]["Enums"]["request_priority"]
          problem_description: string | null
          request_number: string
          responsible_manager_id: string | null
          status: Database["public"]["Enums"]["request_status"]
          type: Database["public"]["Enums"]["request_type"]
          updated_at: string
        }
        Insert: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          assigned_engineer_id?: string | null
          assigned_team_id?: string | null
          client_id: string
          comments?: string | null
          contract_conditions?: string | null
          contract_id?: string | null
          created_at?: string
          deleted_at?: string | null
          desired_date?: string | null
          hours_spent?: number | null
          id?: string
          object_id: string
          planned_visit_date?: string | null
          priority?: Database["public"]["Enums"]["request_priority"]
          problem_description?: string | null
          request_number: string
          responsible_manager_id?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          type?: Database["public"]["Enums"]["request_type"]
          updated_at?: string
        }
        Update: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          assigned_engineer_id?: string | null
          assigned_team_id?: string | null
          client_id?: string
          comments?: string | null
          contract_conditions?: string | null
          contract_id?: string | null
          created_at?: string
          deleted_at?: string | null
          desired_date?: string | null
          hours_spent?: number | null
          id?: string
          object_id?: string
          planned_visit_date?: string | null
          priority?: Database["public"]["Enums"]["request_priority"]
          problem_description?: string | null
          request_number?: string
          responsible_manager_id?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          type?: Database["public"]["Enums"]["request_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_assigned_engineer_id_fkey"
            columns: ["assigned_engineer_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_assigned_team_id_fkey"
            columns: ["assigned_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "service_objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_responsible_manager_id_fkey"
            columns: ["responsible_manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      section_permissions: {
        Row: {
          created_at: string
          id: string
          permission: Database["public"]["Enums"]["permission_level"]
          section: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission?: Database["public"]["Enums"]["permission_level"]
          section: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission?: Database["public"]["Enums"]["permission_level"]
          section?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      service_object_contacts: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          service_object_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          service_object_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          service_object_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_object_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_object_contacts_service_object_id_fkey"
            columns: ["service_object_id"]
            isOneToOne: false
            referencedRelation: "service_objects"
            referencedColumns: ["id"]
          },
        ]
      }
      service_objects: {
        Row: {
          access_description: string | null
          address: string | null
          client_id: string
          created_at: string
          deleted_at: string | null
          id: string
          notes: string | null
          object_name: string
          updated_at: string
        }
        Insert: {
          access_description?: string | null
          address?: string | null
          client_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          object_name: string
          updated_at?: string
        }
        Update: {
          access_description?: string | null
          address?: string | null
          client_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          object_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_objects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      spare_parts: {
        Row: {
          category_id: string | null
          created_at: string
          current_stock: number | null
          id: string
          internal_article: string | null
          min_stock: number | null
          name: string
          notes: string | null
          purchase_price: number | null
          retail_price: number | null
          unit: Database["public"]["Enums"]["unit_type"]
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          current_stock?: number | null
          id?: string
          internal_article?: string | null
          min_stock?: number | null
          name: string
          notes?: string | null
          purchase_price?: number | null
          retail_price?: number | null
          unit?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          current_stock?: number | null
          id?: string
          internal_article?: string | null
          min_stock?: number | null
          name?: string
          notes?: string | null
          purchase_price?: number | null
          retail_price?: number | null
          unit?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "spare_parts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "warehouse_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movement_materials: {
        Row: {
          created_at: string
          id: string
          quantity: number
          spare_part_id: string
          stock_movement_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          quantity?: number
          spare_part_id: string
          stock_movement_id: string
        }
        Update: {
          created_at?: string
          id?: string
          quantity?: number
          spare_part_id?: string
          stock_movement_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movement_materials_spare_part_id_fkey"
            columns: ["spare_part_id"]
            isOneToOne: false
            referencedRelation: "spare_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movement_materials_stock_movement_id_fkey"
            columns: ["stock_movement_id"]
            isOneToOne: false
            referencedRelation: "stock_movements"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          operation_date: string
          operation_type: Database["public"]["Enums"]["operation_type"]
          related_request_id: string | null
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          operation_date?: string
          operation_type: Database["public"]["Enums"]["operation_type"]
          related_request_id?: string | null
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          operation_date?: string
          operation_type?: Database["public"]["Enums"]["operation_type"]
          related_request_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_related_request_id_fkey"
            columns: ["related_request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      task_checklist_items: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          sort_order: number | null
          task_id: string
          text: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          sort_order?: number | null
          task_id: string
          text: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          sort_order?: number | null
          task_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_checklist_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          author_id: string | null
          created_at: string
          id: string
          task_id: string
          text: string
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          id?: string
          task_id: string
          text: string
        }
        Update: {
          author_id?: string | null
          created_at?: string
          id?: string
          task_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          agreed_deadline: string | null
          assignee_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          id: string
          proposed_deadline: string | null
          request_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          agreed_deadline?: string | null
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          proposed_deadline?: string | null
          request_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          agreed_deadline?: string | null
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          proposed_deadline?: string | null
          request_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          team_id: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          team_id: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          competencies: string | null
          created_at: string
          id: string
          leader_id: string | null
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          competencies?: string | null
          created_at?: string
          id?: string
          leader_id?: string | null
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          competencies?: string | null
          created_at?: string
          id?: string
          leader_id?: string | null
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      warehouse_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      work_blocks: {
        Row: {
          created_at: string
          description: string | null
          estimate_id: string
          id: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          estimate_id: string
          id?: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          estimate_id?: string
          id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "work_blocks_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      work_rows: {
        Row: {
          category: Database["public"]["Enums"]["worker_category"]
          created_at: string
          id: string
          plan_hours: number | null
          quantity: number | null
          rate: number | null
          work_block_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["worker_category"]
          created_at?: string
          id?: string
          plan_hours?: number | null
          quantity?: number | null
          rate?: number | null
          work_block_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["worker_category"]
          created_at?: string
          id?: string
          plan_hours?: number | null
          quantity?: number | null
          rate?: number | null
          work_block_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_rows_work_block_id_fkey"
            columns: ["work_block_id"]
            isOneToOne: false
            referencedRelation: "work_blocks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _tmp_dump_auth_users: {
        Args: never
        Returns: {
          sql: string
        }[]
      }
      _tmp_dump_table: { Args: { tbl: string }; Returns: string[] }
      get_section_permission: {
        Args: { _section: string; _user_id: string }
        Returns: Database["public"]["Enums"]["permission_level"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
      assignment_status: "draft" | "new" | "assigned" | "completed"
      client_type: "legal_entity" | "individual_entrepreneur"
      contract_type: "maintenance" | "general" | "one-time"
      document_status: "draft" | "active" | "completed" | "cancelled"
      estimate_status: "черновик" | "готов" | "согласован"
      estimate_type:
        | "простой ремонт"
        | "сложный ремонт"
        | "по договору ТО"
        | "изготовление (производство)"
      invoice_status: "подготовлен" | "выставлен" | "оплачен" | "отменён"
      operation_type: "приход" | "расход" | "возврат"
      permission_level: "none" | "view" | "edit"
      request_priority: "urgent" | "normal"
      request_status:
        | "draft"
        | "new"
        | "needs_calculation"
        | "awaiting_materials"
        | "in_progress"
        | "partially_completed"
        | "completed"
        | "closed"
      request_type: "repair" | "maintenance" | "installation" | "manufacturing"
      task_status: "новая" | "в работе" | "частично выполнена" | "выполнена"
      unit_type:
        | "шт"
        | "м"
        | "кг"
        | "л"
        | "м²"
        | "м³"
        | "пара"
        | "к-т"
        | "мп"
        | "баллон"
        | "уп"
        | "кор"
      worker_category:
        | "Инженер"
        | "Мастер"
        | "Монтажник 6 разр."
        | "Монтажник 5 разр."
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      assignment_status: ["draft", "new", "assigned", "completed"],
      client_type: ["legal_entity", "individual_entrepreneur"],
      contract_type: ["maintenance", "general", "one-time"],
      document_status: ["draft", "active", "completed", "cancelled"],
      estimate_status: ["черновик", "готов", "согласован"],
      estimate_type: [
        "простой ремонт",
        "сложный ремонт",
        "по договору ТО",
        "изготовление (производство)",
      ],
      invoice_status: ["подготовлен", "выставлен", "оплачен", "отменён"],
      operation_type: ["приход", "расход", "возврат"],
      permission_level: ["none", "view", "edit"],
      request_priority: ["urgent", "normal"],
      request_status: [
        "draft",
        "new",
        "needs_calculation",
        "awaiting_materials",
        "in_progress",
        "partially_completed",
        "completed",
        "closed",
      ],
      request_type: ["repair", "maintenance", "installation", "manufacturing"],
      task_status: ["новая", "в работе", "частично выполнена", "выполнена"],
      unit_type: [
        "шт",
        "м",
        "кг",
        "л",
        "м²",
        "м³",
        "пара",
        "к-т",
        "мп",
        "баллон",
        "уп",
        "кор",
      ],
      worker_category: [
        "Инженер",
        "Мастер",
        "Монтажник 6 разр.",
        "Монтажник 5 разр.",
      ],
    },
  },
} as const
