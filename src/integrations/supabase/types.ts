export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      Bookings: {
        Row: {
          Cancelled: string | null
          "Class Date": string | null
          "Class Name": string | null
          "Customer Email": string
          "Home location": string | null
          "Late Cancelled": string | null
          Location: string | null
          "Membership used": string | null
          "No Show": string | null
          "Payment Method": string | null
          Refunded: string | null
          "Sale Date": string | null
          "Sale Value": string | null
          "Sales tax": string | null
          "Sold by": string | null
          Teacher: string | null
        }
        Insert: {
          Cancelled?: string | null
          "Class Date"?: string | null
          "Class Name"?: string | null
          "Customer Email": string
          "Home location"?: string | null
          "Late Cancelled"?: string | null
          Location?: string | null
          "Membership used"?: string | null
          "No Show"?: string | null
          "Payment Method"?: string | null
          Refunded?: string | null
          "Sale Date"?: string | null
          "Sale Value"?: string | null
          "Sales tax"?: string | null
          "Sold by"?: string | null
          Teacher?: string | null
        }
        Update: {
          Cancelled?: string | null
          "Class Date"?: string | null
          "Class Name"?: string | null
          "Customer Email"?: string
          "Home location"?: string | null
          "Late Cancelled"?: string | null
          Location?: string | null
          "Membership used"?: string | null
          "No Show"?: string | null
          "Payment Method"?: string | null
          Refunded?: string | null
          "Sale Date"?: string | null
          "Sale Value"?: string | null
          "Sales tax"?: string | null
          "Sold by"?: string | null
          Teacher?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      Leads: {
        Row: {
          Associate: string | null
          Center: string | null
          Channel: string | null
          "Class Type": string | null
          "Conversion Status": string | null
          "Converted To Customer At": string | null
          "Created At": string | null
          Email: string | null
          "Follow Up 1 Date": string | null
          "Follow Up 2 Date": string | null
          "Follow Up 3 Date": string | null
          "Follow Up 4 Date": string | null
          "Follow Up Comments (1)": string | null
          "Follow Up Comments (2)": string | null
          "Follow Up Comments (3)": string | null
          "Follow Up Comments (4)": string | null
          "Full Name": string | null
          "Host ID": string | null
          ID: number
          LTV: string | null
          "Member ID": string | null
          Period: string | null
          "Phone Number": string | null
          "Purchases Made": string | null
          Remarks: string | null
          "Retention Status": string | null
          Source: string | null
          "Source ID": string | null
          Stage: string | null
          Status: string | null
          "Trial Status": string | null
          Visits: string | null
        }
        Insert: {
          Associate?: string | null
          Center?: string | null
          Channel?: string | null
          "Class Type"?: string | null
          "Conversion Status"?: string | null
          "Converted To Customer At"?: string | null
          "Created At"?: string | null
          Email?: string | null
          "Follow Up 1 Date"?: string | null
          "Follow Up 2 Date"?: string | null
          "Follow Up 3 Date"?: string | null
          "Follow Up 4 Date"?: string | null
          "Follow Up Comments (1)"?: string | null
          "Follow Up Comments (2)"?: string | null
          "Follow Up Comments (3)"?: string | null
          "Follow Up Comments (4)"?: string | null
          "Full Name"?: string | null
          "Host ID"?: string | null
          ID: number
          LTV?: string | null
          "Member ID"?: string | null
          Period?: string | null
          "Phone Number"?: string | null
          "Purchases Made"?: string | null
          Remarks?: string | null
          "Retention Status"?: string | null
          Source?: string | null
          "Source ID"?: string | null
          Stage?: string | null
          Status?: string | null
          "Trial Status"?: string | null
          Visits?: string | null
        }
        Update: {
          Associate?: string | null
          Center?: string | null
          Channel?: string | null
          "Class Type"?: string | null
          "Conversion Status"?: string | null
          "Converted To Customer At"?: string | null
          "Created At"?: string | null
          Email?: string | null
          "Follow Up 1 Date"?: string | null
          "Follow Up 2 Date"?: string | null
          "Follow Up 3 Date"?: string | null
          "Follow Up 4 Date"?: string | null
          "Follow Up Comments (1)"?: string | null
          "Follow Up Comments (2)"?: string | null
          "Follow Up Comments (3)"?: string | null
          "Follow Up Comments (4)"?: string | null
          "Full Name"?: string | null
          "Host ID"?: string | null
          ID?: number
          LTV?: string | null
          "Member ID"?: string | null
          Period?: string | null
          "Phone Number"?: string | null
          "Purchases Made"?: string | null
          Remarks?: string | null
          "Retention Status"?: string | null
          Source?: string | null
          "Source ID"?: string | null
          Stage?: string | null
          Status?: string | null
          "Trial Status"?: string | null
          Visits?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: number
        }
        Insert: {
          created_at?: string
          email: string
          id?: number
        }
        Update: {
          created_at?: string
          email?: string
          id?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize:
        | {
            Args: {
              "": string
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      halfvec_avg: {
        Args: {
          "": number[]
        }
        Returns: unknown
      }
      halfvec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      halfvec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      hnsw_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnswhandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflathandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      l2_norm:
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      l2_normalize:
        | {
            Args: {
              "": string
            }
            Returns: string
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      match_documents: {
        Args: {
          query_embedding: string
          match_count?: number
          filter?: Json
        }
        Returns: {
          id: number
          content: string
          metadata: Json
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      sparsevec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      vector_avg: {
        Args: {
          "": number[]
        }
        Returns: string
      }
      vector_dims:
        | {
            Args: {
              "": string
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      vector_norm: {
        Args: {
          "": string
        }
        Returns: number
      }
      vector_out: {
        Args: {
          "": string
        }
        Returns: unknown
      }
      vector_send: {
        Args: {
          "": string
        }
        Returns: string
      }
      vector_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
