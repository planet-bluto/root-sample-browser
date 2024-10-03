export interface Item {
    id: string;
    name: string;
    date: number;
    parent: string;
    path: string;
    privacy: number;
    size: number;
    type: string;
    direct_link?: string;
}

export interface Folder {
    ancestors: Item[];
    items: Item[];
}