import { Routes } from "@angular/router";
import { AddUser } from "../components/add-user/add-user";
import { AddLine } from "../components/add-line/add-line";
import { Assignment } from "../components/assignment/assignment";
import { Home } from "./home/home";
import { Attendance } from "../components/attendance/attendance";
import { DataManagement } from "../components/data-management/data-management";

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' }, // Land here on startup
    { path: 'home', component: Home },
    { path: 'user', component: AddUser },
    { path: 'line', component: AddLine },
    { path: 'assign', component: Assignment },
    { path: 'attendance', component: Attendance },
    { path: 'data-management', component: DataManagement },
];
