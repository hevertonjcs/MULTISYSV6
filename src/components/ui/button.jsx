import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import React from 'react';

const buttonVariants = cva(
	'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
	{
		variants: {
			variant: {
				default: 'bg-primary text-primary-foreground hover:bg-primary/90',
				destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
				outline:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
				secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
				ghost: 'hover:bg-accent hover:text-accent-foreground',
				link: 'text-primary underline-offset-4 hover:underline',
			},
			size: {
				default: 'h-10 px-4 py-2',
				sm: 'h-9 rounded-md px-3',
				lg: 'h-11 rounded-md px-8',
				icon: 'h-10 w-10',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, type, ...props }, ref) => {
    // Quando `asChild` é verdadeiro, delegamos o tipo ao elemento filho (por exemplo <a>). Caso contrário,
    // especificamos explicitamente o tipo do botão. Por padrão, <button> dentro de um <form>
    // assume o tipo "submit" no HTML padrão, o que pode disparar um envio indesejado da
    // página em alguns contextos móveis. Para evitar isso, definimos `type="button"`
    // como padrão quando não houver tipo fornecido.
    const Comp = asChild ? Slot : 'button';
    const resolvedType = asChild ? undefined : type || 'button';
    return (
        <Comp
            className={cn(buttonVariants({ variant, size, className }))}
            ref={ref}
            type={resolvedType}
            {...props}
        />
    );
});
Button.displayName = 'Button';

export { Button, buttonVariants };