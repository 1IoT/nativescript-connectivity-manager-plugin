import {NgModule} from "@angular/core";
import {Routes} from "@angular/router";
import {NativeScriptRouterModule} from "nativescript-angular/router";
import { NativeScriptHttpClientModule } from 'nativescript-angular/http-client';


import {HomeComponent} from "./home.component";

const routes: Routes = [
    {path: "", component: HomeComponent}
];

@NgModule({
    imports: [NativeScriptRouterModule.forChild(routes),
        NativeScriptHttpClientModule],
    exports: [NativeScriptRouterModule]
})
export class HomeRoutingModule {
}
