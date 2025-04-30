# Aceternity UI Components

A collection of modern, animated UI components based on [Aceternity UI](https://ui.aceternity.com/) for the SinglePageStartup (SPS) project. These components provide beautiful, interactive user interfaces with smooth animations and transitions.

## About Aceternity UI

Aceternity UI is a modern UI library that focuses on:

- Beautiful animations and transitions
- Modern design aesthetics
- Interactive user experiences
- Performance optimization
- Accessibility

## Structure

```
src/
└── lib/
    # Components will be added here
```

## Features

- **Animated Components**: Smooth animations and transitions
- **Modern Design**: Clean and contemporary UI elements
- **Interactive Elements**: Engaging user interactions
- **Responsive Design**: Works across all device sizes
- **Performance Optimized**: Smooth animations without performance impact
- **Accessibility**: WCAG compliant components

## Usage

```typescript
import { Component } from "@sps/shared/ui/aceternity";

// Example usage
<Component
  // Props will be added as components are implemented
/>
```

## Animation System

Aceternity UI uses a sophisticated animation system that includes:

1. **Framer Motion**: For smooth animations and transitions
2. **Tailwind CSS**: For styling and utility classes
3. **Custom Hooks**: For managing animation states
4. **Intersection Observer**: For scroll-based animations

## Best Practices

1. **Performance**:

   - Use `will-change` for elements that will animate
   - Implement proper animation cleanup
   - Use `transform` and `opacity` for animations

2. **Accessibility**:

   - Ensure animations can be disabled
   - Provide proper ARIA attributes
   - Maintain keyboard navigation

3. **User Experience**:
   - Keep animations subtle and purposeful
   - Provide visual feedback for interactions
   - Ensure smooth transitions

## Integration with Other Libraries

Aceternity UI components can be integrated with:

- **Tailwind CSS**: For styling
- **Framer Motion**: For animations
- **React Hook Form**: For form handling
- **Next.js**: For server-side rendering

## Testing

Components are tested using:

- Jest for unit tests
- React Testing Library for component tests
- Performance testing for animations

## License

MIT
