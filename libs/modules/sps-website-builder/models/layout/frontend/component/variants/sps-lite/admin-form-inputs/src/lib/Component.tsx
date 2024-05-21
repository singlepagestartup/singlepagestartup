"use client";

import React, { useState } from "react";
import { IComponentPropsExtended } from "./interface";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sps/shadcn";
import { Component as LayoutsToNavbarsSpsLiteSelectRight } from "@sps/sps-website-builder-relations-layouts-to-navbars-frontend-component-variants-sps-lite-select-right";
import { Component as LayoutsToFooterSpsLiteSelectRight } from "@sps/sps-website-builder-relations-layouts-to-footers-frontend-component-variants-sps-lite-select-right";

export function Component(props: IComponentPropsExtended) {
  const [showLayoutsToNavbars, setShowLayoutsToNavbars] = useState(true);
  const [showLayoutsToFooters, setShowLayoutsToFooters] = useState(true);

  return (
    <form
      data-module="sps-website-builder"
      data-model="layout"
      data-variant={props.variant}
      className="space-y-8"
    >
      <FormField
        control={props.form.control}
        name="title"
        render={({ field }) => {
          return (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Title for layout" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }}
      />
      <FormField
        control={props.form.control}
        name="variant"
        render={({ field }) => {
          return (
            <FormItem>
              <FormLabel>Variant</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select variant" />
                  </SelectTrigger>
                  <SelectContent>
                    {props.variants.map((variant, index) => {
                      return (
                        <SelectItem key={index} value={variant}>
                          {variant}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }}
      />
      <div className="model-container bg-dotted">
        <div className="model-header-block">
          <p className="model-legend">layouts-to-navbars</p>
          <button
            className="pill-button"
            onClick={() => {
              setShowLayoutsToNavbars(!showLayoutsToNavbars);
            }}
          >
            {showLayoutsToNavbars ? "Hide" : "Show"}
          </button>
        </div>
        <div
          className={`flex flex-col gap-6 ${showLayoutsToNavbars ? "" : "hidden"}`}
        >
          {props.data?.layoutsToNavbars.map((layoutToNavbar, index) => {
            return (
              <LayoutsToNavbarsSpsLiteSelectRight
                key={index}
                isServer={false}
                data={layoutToNavbar}
                variant="select-right"
              />
            );
          })}
          <LayoutsToNavbarsSpsLiteSelectRight
            isServer={false}
            variant="select-right"
          />
        </div>
      </div>
      <div className="model-container bg-dotted">
        <div className="model-header-block">
          <p className="model-legend">layouts-to-footers</p>
          <button
            className="pill-button"
            onClick={() => {
              setShowLayoutsToFooters(!showLayoutsToFooters);
            }}
          >
            {showLayoutsToFooters ? "Hide" : "Show"}
          </button>
        </div>
        <div
          className={`flex flex-col gap-6 ${showLayoutsToFooters ? "" : "hidden"}`}
        >
          {props.data?.layoutsToFooters.map((layoutToFooter, index) => {
            return (
              <LayoutsToFooterSpsLiteSelectRight
                key={index}
                isServer={false}
                data={layoutToFooter}
                variant="select-right"
              />
            );
          })}
          <LayoutsToFooterSpsLiteSelectRight
            isServer={false}
            variant="select-right"
          />
        </div>
      </div>
    </form>
  );
}
