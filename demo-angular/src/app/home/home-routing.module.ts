import { NgModule } from "@angular/core";
import { Routes } from "@angular/router";
import {
    NativeScriptRouterModule,
    NativeScriptHttpClientModule,
} from "@nativescript/angular";

import { HomeComponent } from "./home.component";

const routes: Routes = [{ path: "", component: HomeComponent }];

@NgModule({
    imports: [
        NativeScriptRouterModule.forChild(routes),
        NativeScriptHttpClientModule,
    ],
    exports: [NativeScriptRouterModule],
})
export class HomeRoutingModule {}
