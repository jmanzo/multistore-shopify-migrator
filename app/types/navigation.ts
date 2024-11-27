export interface NodeMenu {
    node: Menu;
}

export interface Menu {
    id:     string;
    handle: string;
    title:  string;
    items?: MenuItem[];
}

export interface MenuItem {
    tags:       string[];
    title:      string;
    type:       string;
    url:        string;
    items?:     MenuItem[];
}