export interface Database {
  public: {
    Tables: {
      profile: {
        Row: {
          id: string;
          username: string | null;
          username_normalized: string | null;
          display_name: string | null;
          username_changed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          username_normalized?: string | null;
          display_name?: string | null;
          username_changed_at?: string | null;
        };
        Update: {
          username?: string | null;
          username_normalized?: string | null;
          display_name?: string | null;
          username_changed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      space: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
        };
        Update: {
          name?: string;
          description?: string | null;
        };
        Relationships: [];
      };
      space_member: {
        Row: {
          space_id: string;
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          space_id: string;
          user_id: string;
          role: string;
        };
        Update: {
          role?: string;
        };
        Relationships: [];
      };
      space_invite: {
        Row: {
          id: string;
          space_id: string;
          token_hash: string;
          token_prefix: string;
          max_uses: number;
          use_count: number;
          expires_at: string | null;
          created_by: string;
          created_at: string;
          disabled_at: string | null;
          consumed_at: string | null;
        };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
      space_invite_use: {
        Row: {
          id: string;
          invite_id: string;
          space_id: string;
          user_id: string;
          used_at: string;
        };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
      pod: {
        Row: {
          id: string;
          space_id: string;
          feature: string;
          name: string | null;
          description: string | null;
          visibility: string;
          status: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
      pod_member: {
        Row: {
          pod_id: string;
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
      todo_column: {
        Row: {
          id: string;
          pod_id: string;
          title: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          pod_id: string;
          title: string;
          sort_order?: number;
        };
        Update: {
          title?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      todo_card: {
        Row: {
          id: string;
          pod_id: string;
          column_id: string | null;
          title: string;
          description: string;
          due_at: string | null;
          tags: string[];
          assignee_user_id: string | null;
          sort_order: number;
          completed_at: string | null;
          icon_path: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          pod_id: string;
          column_id?: string | null;
          title: string;
          description?: string;
          due_at?: string | null;
          tags?: string[];
          assignee_user_id?: string | null;
          sort_order?: number;
          completed_at?: string | null;
          icon_path?: string | null;
          created_by: string;
        };
        Update: {
          column_id?: string | null;
          title?: string;
          description?: string;
          due_at?: string | null;
          tags?: string[];
          assignee_user_id?: string | null;
          sort_order?: number;
          completed_at?: string | null;
          icon_path?: string | null;
        };
        Relationships: [];
      };
      todo_card_comment: {
        Row: {
          id: string;
          pod_id: string;
          card_id: string;
          body: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          pod_id: string;
          card_id: string;
          body: string;
          created_by: string;
        };
        Update: {
          body?: string;
        };
        Relationships: [];
      };
      fp_setting: {
        Row: {
          pod_id: string;
          currency: string;
          permission: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          pod_id: string;
          currency?: string;
          permission?: Record<string, unknown>;
        };
        Update: {
          currency?: string;
          permission?: Record<string, unknown>;
        };
        Relationships: [];
      };
      fp_account: {
        Row: {
          id: string;
          pod_id: string;
          name: string;
          kind: string;
          opening_fund: string;
          archived: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          pod_id: string;
          name: string;
          kind: string;
          opening_fund?: number | string;
          archived?: boolean;
          notes?: string | null;
        };
        Update: {
          name?: string;
          kind?: string;
          opening_fund?: number | string;
          archived?: boolean;
          notes?: string | null;
        };
        Relationships: [];
      };
      fp_category: {
        Row: {
          id: string;
          pod_id: string;
          name: string;
          direction: string;
          budget_amount: string | null;
          budget_period: string | null;
          favourite: boolean;
          sort_order: number;
          colour: string | null;
          filters: unknown;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          pod_id: string;
          name: string;
          direction: string;
          budget_amount?: number | string | null;
          budget_period?: string | null;
          favourite?: boolean;
          sort_order?: number;
          colour?: string | null;
          filters?: unknown;
        };
        Update: {
          name?: string;
          direction?: string;
          budget_amount?: number | string | null;
          budget_period?: string | null;
          favourite?: boolean;
          sort_order?: number;
          colour?: string | null;
          filters?: unknown;
        };
        Relationships: [];
      };
      fp_parser: {
        Row: {
          id: string;
          pod_id: string;
          name: string;
          identifier: string | null;
          has_header: boolean;
          skip_rows: number;
          delimiter: string;
          column_map: unknown;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          pod_id: string;
          name: string;
          identifier?: string | null;
          has_header?: boolean;
          skip_rows?: number;
          delimiter?: string;
          column_map?: unknown;
        };
        Update: {
          name?: string;
          identifier?: string | null;
          has_header?: boolean;
          skip_rows?: number;
          delimiter?: string;
          column_map?: unknown;
        };
        Relationships: [];
      };
      fp_import: {
        Row: {
          id: string;
          pod_id: string;
          parser_id: string | null;
          account_id: string;
          created_by: string;
          created_at: string;
          undone_at: string | null;
        };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
      fp_import_file: {
        Row: {
          id: string;
          import_id: string;
          pod_id: string;
          file_name: string;
          content_sha256: string;
          parsed: number;
          created_count: number;
          duplicate_skipped: number;
          failed: number;
          errors: unknown;
          created_at: string;
        };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
      fp_transaction: {
        Row: {
          id: string;
          pod_id: string;
          account_id: string;
          posted_date: string;
          posted_time: string | null;
          amount: string;
          description: string;
          recipient: string;
          notes: string;
          external_id: string | null;
          category_id: string | null;
          confirmed: boolean;
          parser_id: string | null;
          import_id: string | null;
          archived: boolean;
          parent_id: string | null;
          split_portion_count: number | null;
          split_recurrence: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          pod_id: string;
          account_id: string;
          posted_date: string;
          posted_time?: string | null;
          amount: number | string;
          description?: string;
          recipient?: string;
          notes?: string;
          external_id?: string | null;
          category_id?: string | null;
          confirmed?: boolean;
          parser_id?: string | null;
          import_id?: string | null;
          archived?: boolean;
          parent_id?: string | null;
          split_portion_count?: number | null;
          split_recurrence?: string | null;
          created_by: string;
        };
        Update: {
          account_id?: string;
          posted_date?: string;
          posted_time?: string | null;
          amount?: number | string;
          description?: string;
          recipient?: string;
          notes?: string;
          external_id?: string | null;
          category_id?: string | null;
          confirmed?: boolean;
          archived?: boolean;
          parent_id?: string | null;
          split_portion_count?: number | null;
          split_recurrence?: string | null;
        };
        Relationships: [];
      };
      pod_join_request: {
        Row: {
          id: string;
          pod_id: string;
          user_id: string;
          status: string;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_space: {Args: {p_name: string; p_description?: string}; Returns: string};
      update_space: {Args: {p_space_id: string; p_name: string; p_description?: string}; Returns: undefined};
      update_profile_username: {Args: {p_username: string}; Returns: undefined};
      update_profile_display_name: {Args: {p_display_name: string}; Returns: undefined};
      update_space_member_role: {
        Args: {p_space_id: string; p_user_id: string; p_role: string};
        Returns: undefined;
      };
      create_space_invite: {
        Args: {p_space_id: string; p_expires_in_days: number; p_max_uses: number};
        Returns: string;
      };
      disable_space_invite: {Args: {p_invite_id: string}; Returns: undefined};
      delete_space_invite: {Args: {p_invite_id: string}; Returns: undefined};
      join_space_with_invite: {Args: {p_token: string}; Returns: string};
      list_space_invites: {
        Args: {p_space_id: string; p_status: string; p_limit: number; p_offset: number};
        Returns: {
          id: string;
          token_prefix: string;
          expires_at: string | null;
          max_uses: number;
          use_count: number;
          created_at: string;
          disabled_at: string | null;
          consumed_at: string | null;
          invite_status: string;
          total_count: number;
        }[];
      };
      create_pod: {
        Args: {
          p_space_id: string;
          p_feature: string;
          p_name: string;
          p_visibility: string;
          p_description?: string;
        };
        Returns: string;
      };
      update_pod: {
        Args: {p_pod_id: string; p_name: string; p_visibility: string; p_description?: string};
        Returns: undefined;
      };
      set_pod_status: {Args: {p_pod_id: string; p_status: string}; Returns: undefined};
      delete_pod: {Args: {p_pod_id: string}; Returns: undefined};
      join_open_pod: {Args: {p_pod_id: string}; Returns: undefined};
      create_pod_join_request: {Args: {p_pod_id: string}; Returns: string};
      approve_pod_join_request: {Args: {p_request_id: string}; Returns: undefined};
      deny_pod_join_request: {Args: {p_request_id: string}; Returns: undefined};
      add_pod_member_by_username: {
        Args: {p_pod_id: string; p_username: string; p_role: string};
        Returns: undefined;
      };
      update_pod_member_role: {
        Args: {p_pod_id: string; p_user_id: string; p_role: string};
        Returns: undefined;
      };
      create_fp_import: {
        Args: {p_pod_id: string; p_parser_id: string | null; p_account_id: string; p_files: unknown};
        Returns: string;
      };
      undo_fp_import: {Args: {p_import_id: string}; Returns: undefined};
      delete_all_fp_transactions: {Args: {p_pod_id: string}; Returns: undefined};
      sum_fp_account_balance: {Args: {p_account_id: string}; Returns: number};
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
