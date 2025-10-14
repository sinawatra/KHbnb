"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export default function AuthForm() {

  return (
    <div className="max-w-md mx-auto mb-5 p-6 bg-white rounded shadow">

        <Tabs defaultValue="login">
          <TabsList className="grid w-full grid-cols-2 mb-5">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <Card>
              <CardContent className="grid gap-6 px-0">
                <div className="grid gap-3">
                  <Label htmlFor="tabs-demo-name">Email</Label>
                  <Input id="tabs-demo-name"/>
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="tabs-demo-username">Password</Label>
                  <Input id="tabs-demo-username"/>
                </div>
              </CardContent>
              <CardFooter className="px-0">
                <Button className="w-full">Login</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardContent className="grid gap-6 px-0">
                <div className="grid gap-3">
                  <Label htmlFor="tabs-demo-name">Full name</Label>
                  <Input id="tabs-demo-name"/>
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="tabs-demo-username">Email</Label>
                  <Input id="tabs-demo-username"/>
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="tabs-demo-name">Password</Label>
                  <Input id="tabs-demo-name"/>
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="tabs-demo-username">Phone number</Label>
                  <Input id="tabs-demo-username"/>
                </div>
              </CardContent>
              <CardFooter className="px-0">
                <Button className="w-full">Create Account</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
}
