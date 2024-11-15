import svelte from 'rollup-plugin-svelte';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import css from 'rollup-plugin-css-only';
import sveltePreprocess from 'svelte-preprocess';
import replace from '@rollup/plugin-replace';

const production = !process.env.ROLLUP_WATCH;

export default {
    input: 'src/main.js',
    output: {
        sourcemap: true,
        format: 'iife',
        name: 'app',
        file: 'public/build/bundle.js'
    },
    plugins: [
        svelte({
            compilerOptions: {
                dev: !production,
            },
            preprocess: sveltePreprocess(),
        }),

        // Extract CSS into a separate file
        css({ output: 'bundle.css' }),

        resolve({
            browser: true,
            dedupe: ['svelte']
        }),
        commonjs(),

        !production && livereload('public'),

        production && terser(),

        replace({
            preventAssignment: true,
            'process.env.VITE_BACKEND_URL': JSON.stringify(process.env.VITE_BACKEND_URL)
        })
    ],
    watch: {
        clearScreen: false
    }
};
