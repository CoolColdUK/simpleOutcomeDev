export interface Database {
  public: {
    Tables: {
      profile: {
        Row: {
          id: string;
          username: string | null;
          username_normalized: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          username_normalized?: string | null;
        };
        Update: {
          username?: string | null;
          username_normalized?: string | null;
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
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
