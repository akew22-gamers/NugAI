type ClassValue = string | number | bigint | boolean | ClassArray | ClassDictionary | null | undefined

interface ClassDictionary {
  [id: string]: any
}

interface ClassArray extends Array<ClassValue> {}

function clsx(...inputs: ClassValue[]): string {
  const classes: string[] = []
  
  for (const input of inputs) {
    if (!input) continue
    
    if (typeof input === "string" || typeof input === "number") {
      classes.push(String(input))
    } else if (Array.isArray(input)) {
      const result = clsx(...input)
      if (result) classes.push(result)
    } else if (typeof input === "object") {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key)
      }
    }
  }
  
  return classes.join(" ")
}

function twMerge(...inputs: ClassValue[]): string {
  const classes = clsx(...inputs).split(" ")
  const seen = new Map<string, string>()
  
  for (const cls of classes) {
    if (!cls) continue
    
    const match = cls.match(/^([a-z]+(-[a-z]+)?)-/)
    const key = match ? match[1] : cls
    
    seen.set(key, cls)
  }
  
  return Array.from(seen.values()).join(" ")
}

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
