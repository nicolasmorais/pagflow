"use client";

import { useEffect } from "react";
import { initGlobalErrorHandlers } from "@/lib/error-reporter";

export default function ErrorReporter() {
    useEffect(() => {
        initGlobalErrorHandlers();
    }, []);
    return null;
}
