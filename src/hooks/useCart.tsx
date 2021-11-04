import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      var updateCart = [...cart];
      var currentCart = updateCart.find((product) => product.id === productId);

      var currentAmount = currentCart ? currentCart.amount : 0;
      var updateAmount = (currentAmount += 1);

      var stock = await api.get(`stock/${productId}`);

      if (updateAmount > stock.data.amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if (currentCart) {
        currentCart.amount = updateAmount;
      } else {
        var product = await api.get(`products/${productId}`);

        const newProduct = {
          ...product.data,
          amount: 1,
        };

        updateCart.push(newProduct);
      }

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updateCart));
      setCart(updateCart);
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      var updateCart = [...cart];

      if (updateCart.findIndex((product) => product.id === productId) === -1)
        throw Error();

      updateCart = updateCart.filter((product) => product.id !== productId);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updateCart));
      setCart(updateCart);
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount < 1) {
        throw Error();
      }
      var updateCart = [...cart];
      var currentCart = updateCart.find((product) => product.id === productId);

      var stock = await api.get(`stock/${productId}`);

      if (amount > stock.data.amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if (currentCart) {
        currentCart.amount = amount;
      }

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updateCart));
      setCart(updateCart);
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
